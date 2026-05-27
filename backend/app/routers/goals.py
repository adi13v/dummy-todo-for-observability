from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("", response_model=List[schemas.GoalResponse])
def get_goals(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()

@router.post("", response_model=schemas.GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(goal_in: schemas.GoalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Create main Goal record
    db_goal = models.Goal(
        title=goal_in.title,
        target_time=goal_in.target_time,
        user_id=current_user.id
    )
    db.add(db_goal)
    db.flush()  # Populates db_goal.id before creating nested task foreign keys

    # Create associated checklist items
    for task_title in goal_in.tasks:
        db_task = models.GoalTask(
            title=task_title,
            goal_id=db_goal.id
        )
        db.add(db_task)

    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.patch("/{goal_id}/tasks/{task_id}/toggle", response_model=schemas.GoalResponse)
def toggle_goal_task(goal_id: str, task_id: str, update_in: schemas.GoalTaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    db_task = db.query(models.GoalTask).filter(
        models.GoalTask.id == task_id,
        models.GoalTask.goal_id == goal_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found under this goal")

    db_task.completed = update_in.completed
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_goal = db.query(models.Goal).filter(models.Goal.id == id, models.Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    
    db.delete(db_goal)
    db.commit()
    return None
