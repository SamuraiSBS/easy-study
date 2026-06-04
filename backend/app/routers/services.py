from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Service
from app.schemas import ServiceRead

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceRead])
async def list_services(db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Service)
        .where(Service.is_active.is_(True))
        .order_by(Service.order_num.asc(), Service.title.asc())
    )
    return result.scalars().all()


@router.get("/{service_id}", response_model=ServiceRead)
async def get_service(service_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.is_active.is_(True))
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service

