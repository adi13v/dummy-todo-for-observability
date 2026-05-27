import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

class Todo(Base):
    __tablename__ = "todos"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="todos")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    target_time = Column(DateTime(timezone=True), nullable=False) # Event/Deadline timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationship to tasks, cascading deletes
    tasks = relationship("GoalTask", back_populates="goal", cascade="all, delete-orphan", passive_deletes=True)
    user = relationship("User", back_populates="goals")

class GoalTask(Base):
    __tablename__ = "goal_tasks"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    goal_id = Column(String, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)

    goal = relationship("Goal", back_populates="tasks")
