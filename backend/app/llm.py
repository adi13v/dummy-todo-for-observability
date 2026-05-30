import openai
from fastapi import HTTPException
from typing import List
from . import models
from langsmith import traceable
from langsmith.wrappers import wrap_openai
from langsmith.run_helpers import set_run_metadata
from .database import SessionLocal

client = wrap_openai(openai.Client())


@traceable(name="LLM Call", run_type="llm")
def llm_call(user_input: str, chat_id: str) -> str:
    """
    Calls the OpenAI API with the given context and conversation history.
    """
    set_run_metadata(thread_id=chat_id, email_id="aditya2310v@gmail.com")

    db = SessionLocal()
    try:
        history = (
            db.query(models.Message)
            .filter(models.Message.chat_id == chat_id)
            .order_by(models.Message.created_at.asc())
            .all()
        )

        messages_payload = []
        for msg in history:
            messages_payload.append({"role": msg.role, "content": msg.content})

        # Stitch the current user message to the history for the API call
        messages_payload.append({"role": "user", "content": user_input})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_payload,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")
    finally:
        db.close()
