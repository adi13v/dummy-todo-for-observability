from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from ..prompt import get_system_prompt
import os
from ..llm import llm_call

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "/sessions",
    response_model=schemas.ChatResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_chat_session(
    chat: schemas.ChatCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    new_chat = models.Chat(title=chat.title, user_id=user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat


@router.get("/sessions", response_model=List[schemas.ChatResponse])
def get_chat_sessions(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    chats = (
        db.query(models.Chat)
        .filter(models.Chat.user_id == user.id)
        .order_by(models.Chat.created_at.desc())
        .all()
    )
    return chats


@router.get(
    "/sessions/{chat_id}/messages", response_model=List[schemas.MessageResponse]
)
def get_chat_messages(
    chat_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    chat = (
        db.query(models.Chat)
        .filter(models.Chat.id == chat_id, models.Chat.user_id == user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages


@router.post("/sessions/{chat_id}/messages", response_model=schemas.MessageResponse)
def send_message(
    chat_id: str,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    chat = (
        db.query(models.Chat)
        .filter(models.Chat.id == chat_id, models.Chat.user_id == user.id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.title == "New Chat" or chat.title == "":
        words = message.content.split()
        chat.title = " ".join(words[:4]) + ("..." if len(words) > 4 else "")
        db.add(chat)

        # Create system message with todos if this is the first message
        todos = db.query(models.Todo).filter(models.Todo.user_id == user.id).all()
        todos_data = [
            {"id": t.id, "title": t.title, "completed": t.completed} for t in todos
        ]
        loaded_todos = json.dumps(todos_data, indent=2)

        sys_prompt_content = get_system_prompt(loaded_todos)
        sys_msg = models.Message(
            chat_id=chat_id, role="system", content=sys_prompt_content
        )
        db.add(sys_msg)
        db.commit()

    # 1. Call OpenAI (this will fetch history internally and stitch the user payload)
    ai_content = llm_call(message.content, chat_id)

    # 2. Save user message to DB
    user_msg = models.Message(chat_id=chat_id, role="user", content=message.content)
    db.add(user_msg)

    # 3. Save AI message to DB
    ai_msg = models.Message(chat_id=chat_id, role="assistant", content=ai_content)
    db.add(ai_msg)

    db.commit()
    db.refresh(ai_msg)

    # Note: Returning the AI's message response so the frontend can append it to the chat UI.
    # The frontend already knows the user's message since they just sent it.
    return ai_msg
