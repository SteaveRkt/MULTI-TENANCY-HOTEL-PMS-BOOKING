import uuid

import pytest

from app.api.routes.public import sort_public_rooms, normalize_image_urls, normalize_public_room_rating
from app.schemas.public_booking import PublicRoomResponse


@pytest.fixture
def room_list():
    room_a = {
        "room_id": uuid.uuid4(),
        "hotel_name": "Alpha Hotel",
        "room_number": "101",
        "room_type": "DELUXE",
        "capacity": 2,
        "price_per_night": 120000,
        "description": "A",
        "image_url": None,
        "rating": 4.1,
        "reviews_count": 18,
    }
    room_b = {
        "room_id": uuid.uuid4(),
        "hotel_name": "Beta Hotel",
        "room_number": "202",
        "room_type": "STANDARD",
        "capacity": 3,
        "price_per_night": 98000,
        "description": "B",
        "image_url": None,
        "rating": 4.9,
        "reviews_count": 210,
    }
    return [room_a, room_b]


def test_public_room_response_includes_rating_fields():
    room = PublicRoomResponse(
        hotel_name="Hotel Test",
        room_id=uuid.uuid4(),
        room_number="A1",
        room_type="SUITE",
        capacity=2,
        price_per_night=150000,
        description="Nice suite",
        image_url=None,
        rating=4.8,
        reviews_count=142,
    )

    assert room.rating == 4.8
    assert room.reviews_count == 142


def test_sort_public_rooms_by_rating_desc(room_list):
    result = sort_public_rooms(room_list)

    assert [room["room_id"] for room in result] == [
        room_list[1]["room_id"],
        room_list[0]["room_id"],
    ]


def test_normalize_image_urls_keeps_unique_urls():
    urls = normalize_image_urls(
        ["https://a.com/1", "", "https://a.com/1", "https://b.com/2"],
        "https://fallback.com/cover",
    )

    assert urls == ["https://a.com/1", "https://b.com/2", "https://fallback.com/cover"]


def test_public_room_response_allows_multiple_images():
    room = PublicRoomResponse(
        hotel_name="Hotel Test",
        room_id=uuid.uuid4(),
        room_number="A1",
        room_type="SUITE",
        capacity=2,
        price_per_night=150000,
        description="Nice suite",
        image_url="https://cover.test/1",
        image_urls=["https://cover.test/1", "https://cover.test/2"],
        rating=4.8,
        reviews_count=142,
    )

    assert room.image_urls == ["https://cover.test/1", "https://cover.test/2"]


def test_public_room_response_defaults_to_no_rating_when_no_reviews_exist():
    room = PublicRoomResponse(
        hotel_name="Hotel Test",
        room_id=uuid.uuid4(),
        room_number="A1",
        room_type="SUITE",
        capacity=2,
        price_per_night=150000,
        description="Nice suite",
        image_url=None,
    )

    assert room.rating == 0
    assert room.reviews_count == 0


def test_public_room_review_response_includes_reviewer_name_and_comment():
    review = PublicRoomResponse(
        hotel_name="Hotel Test",
        room_id=uuid.uuid4(),
        room_number="A1",
        room_type="SUITE",
        capacity=2,
        price_per_night=150000,
        description="Nice suite",
        image_url=None,
        rating=4.8,
        reviews_count=142,
        reviews=[
            {"reviewer_name": "Alice", "comment": "Très bon séjour", "rating": 5},
        ],
    )

    assert review.rating == 4.8
    assert review.reviews_count == 142
    assert review.reviews[0].reviewer_name == "Alice"
    assert review.reviews[0].comment == "Très bon séjour"


def test_normalize_public_room_rating_keeps_zero_review_rooms_unrated():
    assert normalize_public_room_rating(4.5, 0) == 0.0
    assert normalize_public_room_rating(4.5, 1) == 4.5
