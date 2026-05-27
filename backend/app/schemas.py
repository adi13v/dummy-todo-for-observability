from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List

# ==================== USER SCHEMAS ====================

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    email: str
    created_at: datetime = Field(..., alias="createdAt")

class Token(BaseModel):
    access_token: str
    token_type: str

# ==================== TODO SCHEMAS ====================

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    completed: bool

class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    completed: bool
    created_at: datetime = Field(..., alias="createdAt")

# ==================== GOAL SCHEMAS ====================

class GoalTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    completed: bool

class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    target_time: datetime = Field(..., alias="targetTime")
    created_at: datetime = Field(..., alias="createdAt")
    tasks: List[GoalTaskResponse]

class GoalCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    target_time: datetime = Field(..., alias="targetTime")
    tasks: List[str] = [] # List of sub-task titles to create nested

class GoalTaskUpdate(BaseModel):
    completed: bool
