"""Shared Pydantic base model.

The frontend TypeScript types (frontend/src/types/index.ts) use camelCase
field names. This base model serializes/accepts camelCase over the wire
while keeping idiomatic snake_case attribute names in Python, so backend
JSON matches the shape the frontend already expects.
"""
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
