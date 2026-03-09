import asyncio
import sys
import os
import traceback

sys.path.append(os.getcwd())

from database import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from models import Shipment, ShipmentTimeline
from schemas import ShipmentResponse

async def test_serialization():
    print("Testing Pydantic serialization...")
    async with AsyncSessionLocal() as db:
        query = select(Shipment).options(
            selectinload(Shipment.items),
            selectinload(Shipment.timeline).joinedload(ShipmentTimeline.updated_by),
            selectinload(Shipment.assigned_vehicle),
            selectinload(Shipment.assigned_driver),
            selectinload(Shipment.receipt)
        )
        result = await db.execute(query)
        items = result.scalars().all()
        
        try:
            for item in items:
                # Assuming Pydantic v2 (model_validate) or v1 (from_orm)
                if hasattr(ShipmentResponse, 'model_validate'):
                    ShipmentResponse.model_validate(item)
                else:
                    ShipmentResponse.from_orm(item)
            with open("test_pydantic.txt", "w", encoding="utf-8") as f:
                f.write("Successfully serialized all shipments\n")
        except Exception as e:
            with open("test_pydantic.txt", "w", encoding="utf-8") as f:
                traceback.print_exc(file=f)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_serialization())
