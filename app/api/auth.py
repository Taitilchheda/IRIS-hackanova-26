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


def get_current_user(token: str = Depends(oauth2_scheme)):
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        if email is None:
            raise cred_exc
    except JWTError:
        raise cred_exc
    if email.lower() != settings.admin_email.lower():
        raise cred_exc
    return {"email": settings.admin_email, "role": "admin"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not verify_admin(form_data.username, form_data.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token(settings.admin_email)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register")
def register(email: str = Form(...), password: str = Form(...)):
    if not verify_admin(email, password):
        raise HTTPException(status_code=400, detail="Registration disabled; use admin credentials")
    token = create_access_token(settings.admin_email)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
