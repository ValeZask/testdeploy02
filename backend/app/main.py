from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from .database import engine, get_db
from .models import Task, Base

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic модели
class TaskCreate(BaseModel):
    title: str
    description: str = ""


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


@app.get("/")
def root():
    return {"message": "Task API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/tasks/", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(title=task.title, description=task.description)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@app.get("/tasks/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return tasks


@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task