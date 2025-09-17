import os
import cv2
import base64
from typing import Dict, List
import numpy as np
import asyncio
from openai import OpenAI


def _extract_sampled_frames_as_base64(video_path: str, sample_every_n_frames: int = 50, max_frames: int = 30) -> List[str]:
    capture = cv2.VideoCapture(video_path)
    if not capture.isOpened():
        raise RuntimeError("Failed to open video")

    base64_frames: List[str] = []
    frame_index = 0
    while True:
        success, frame = capture.read()
        if not success:
            break
        if frame_index % sample_every_n_frames == 0:
            success_jpg, buffer = cv2.imencode(".jpg", frame)
            if success_jpg:
                base64_frames.append(base64.b64encode(buffer).decode("utf-8"))
            if len(base64_frames) >= max_frames:
                break
        frame_index += 1
    capture.release()
    return base64_frames


async def analyze_video_and_summarize(video_path: str) -> Dict[str, str]:
    # Extract representative frames
    frames = await asyncio.to_thread(_extract_sampled_frames_as_base64, video_path)

    if len(frames) == 0:
        raise RuntimeError("No frames extracted from video")

    # Prepare prompt
    prompt = {
        "role": "user",
        "content": [
            "You are an animal behaviorist observing the animal in the following frames. Provide: 1) Activity observations, 2) Signs of illness or discomfort, 3) Health assessment (movement, social interaction, physical form, coat/skin), 4) Recommendations for care, 5) Write as a cohesive narrative suited for a zoo care report. Do not mention frames or numbers.",
            *map(lambda x: {"image": x, "resize": 768}, frames),
        ],
    }

    client = OpenAI()
    result = await asyncio.to_thread(
        client.chat.completions.create,
        model="gpt-4o",
        messages=[prompt],
        max_tokens=1200,
    )

    report = result.choices[0].message.content
    return {"report": report}

