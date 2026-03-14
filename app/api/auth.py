from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or settings.access_token_exp_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_admin(email: str, password: str) -> bool:
    return email.lower() == settings.admin_email.lower() and password == settings.admin_password


def get_current_user():
    # Bypass authentication: always return the default admin user
    return {"email": settings.admin_email, "role": "admin"}


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
