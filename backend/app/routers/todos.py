from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=List[schemas.TodoResponse])
def get_todos(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    # Returns todos ordered by created_at descending
    return (
        db.query(models.Todo)
        .filter(models.Todo.user_id == current_user.id)
        .order_by(models.Todo.created_at.desc())
        .all()
    )


@router.post(
    "", response_model=schemas.TodoResponse, status_code=status.HTTP_201_CREATED
)
def create_todo(
    todo_in: schemas.TodoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_todo = models.Todo(title=todo_in.title, user_id=current_user.id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    raise ValueError("Something went wrong!")
    return db_todo


@router.patch("/{id}/toggle", response_model=schemas.TodoResponse)
def toggle_todo(
    id: str,
    update_in: schemas.TodoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_todo = (
        db.query(models.Todo)
        .filter(models.Todo.id == id, models.Todo.user_id == current_user.id)
        .first()
    )
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found"
        )
    db_todo.completed = update_in.completed
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_todo = (
        db.query(models.Todo)
        .filter(models.Todo.id == id, models.Todo.user_id == current_user.id)
        .first()
    )
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found"
        )
    db.delete(db_todo)
    db.commit()
    return None
