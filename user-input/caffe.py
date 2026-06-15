from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable, Sequence

import matplotlib.pyplot as plt
import numpy as np


Intake = Sequence[object]  # [start_time: str, end_time: str, dose_mg: float]


def parse_clock_time(clock_time: str, base_date: str = "2026-01-01") -> datetime:
    """
    Parse an HH:MM clock time using a fixed base date.

    Special case:
        "24:00" is interpreted as midnight of the following day.
    """
    if clock_time == "24:00":
        return datetime.fromisoformat(f"{base_date} 00:00") + timedelta(days=1)

    return datetime.fromisoformat(f"{base_date} {clock_time}")


def estimate_caffeine_remaining(
    intakes: Iterable[Intake],
    elimination_half_life_hours: float = 6.0,
    absorption_half_life_minutes: float = 30.0,
    plot_start: str = "06:00",
    plot_end: str = "24:00",
    step_minutes: float = 1.0,
    base_date: str = "2026-01-01",
) -> tuple[list[datetime], np.ndarray]:
    """
    Estimate active caffeine remaining in the body over time.

    Model
    -----
    This is a simplified two-compartment first-order model:

        dG/dt = input(t) - ka * G
        dB/dt = ka * G - ke * B

    where:
        G  = caffeine amount in the gut compartment, in mg
        B  = estimated active caffeine remaining in the body, in mg
        ka = first-order absorption rate constant, in 1/hour
        ke = first-order elimination rate constant, in 1/hour

    Intake format
    -------------
    Each intake is:

        [start_time, end_time, dose_mg]

    Example:

        ["07:00", "07:10", 180]

    means 180 mg is consumed evenly from 07:00 to 07:10.

    Interpretation
    --------------
    This model estimates remaining active caffeine amount in mg.
    It is not a clinical blood concentration model and does not estimate mg/L.
    The result should be used for rough visualization, not medical prediction.
    """

    if elimination_half_life_hours <= 0:
        raise ValueError("elimination_half_life_hours must be positive.")

    if absorption_half_life_minutes <= 0:
        raise ValueError("absorption_half_life_minutes must be positive.")

    if step_minutes <= 0:
        raise ValueError("step_minutes must be positive.")

    ke = np.log(2.0) / elimination_half_life_hours
    ka = np.log(2.0) / (absorption_half_life_minutes / 60.0)

    start_dt = parse_clock_time(plot_start, base_date)
    end_dt = parse_clock_time(plot_end, base_date)

    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    dt_hours = step_minutes / 60.0
    n_steps = int((end_dt - start_dt).total_seconds() // (step_minutes * 60)) + 1

    times = [
        start_dt + timedelta(minutes=i * step_minutes)
        for i in range(n_steps)
    ]

    body = np.zeros(n_steps)
    gut = 0.0

    parsed_intakes: list[tuple[datetime, datetime, float]] = []

    for raw_start, raw_end, raw_dose in intakes:
        intake_start = parse_clock_time(str(raw_start), base_date)
        intake_end = parse_clock_time(str(raw_end), base_date)
        dose_mg = float(raw_dose)

        if dose_mg < 0:
            raise ValueError("dose_mg must be non-negative.")

        if intake_end <= intake_start:
            intake_end += timedelta(days=1)

        duration_hours = (intake_end - intake_start).total_seconds() / 3600.0

        if duration_hours <= 0:
            raise ValueError("Each intake must have a positive duration.")

        intake_rate_mg_per_hour = dose_mg / duration_hours
        parsed_intakes.append(
            (intake_start, intake_end, intake_rate_mg_per_hour)
        )

    for i in range(1, n_steps):
        previous_time = times[i - 1]
        current_time = times[i]

        ingested_mg = 0.0

        for intake_start, intake_end, intake_rate in parsed_intakes:
            overlap_start = max(previous_time, intake_start)
            overlap_end = min(current_time, intake_end)

            if overlap_end > overlap_start:
                overlap_hours = (
                    overlap_end - overlap_start
                ).total_seconds() / 3600.0

                ingested_mg += intake_rate * overlap_hours

        gut += ingested_mg

        absorbed_mg = gut * (1.0 - np.exp(-ka * dt_hours))
        gut -= absorbed_mg

        remaining_from_previous_body = body[i - 1] * np.exp(-ke * dt_hours)

        # Midpoint correction:
        # The newly absorbed amount is assumed to enter the active body
        # compartment, on average, halfway through the timestep.
        remaining_from_new_absorption = absorbed_mg * np.exp(
            -ke * dt_hours / 2.0
        )

        body[i] = remaining_from_previous_body + remaining_from_new_absorption

    return times, body


def plot_caffeine_remaining(
    intakes: Iterable[Intake],
    elimination_half_life_hours: float = 6.0,
    half_life_range_hours: float = 1.0,
    absorption_half_life_minutes: float = 30.0,
    plot_start: str = "06:00",
    plot_end: str = "24:00",
    step_minutes: float = 1.0,
    reference_threshold_mg: float = 20.0,
) -> None:
    """
    Plot estimated active caffeine remaining with a half-life sensitivity range.

    The shaded band represents:

        elimination_half_life_hours ± half_life_range_hours
    """

    if half_life_range_hours < 0:
        raise ValueError("half_life_range_hours must be non-negative.")

    lower_half_life = elimination_half_life_hours - half_life_range_hours
    upper_half_life = elimination_half_life_hours + half_life_range_hours

    if lower_half_life <= 0:
        raise ValueError(
            "elimination_half_life_hours - half_life_range_hours "
            "must be positive."
        )

    common_kwargs = {
        "intakes": intakes,
        "absorption_half_life_minutes": absorption_half_life_minutes,
        "plot_start": plot_start,
        "plot_end": plot_end,
        "step_minutes": step_minutes,
    }

    times, caffeine_base = estimate_caffeine_remaining(
        elimination_half_life_hours=elimination_half_life_hours,
        **common_kwargs,
    )

    _, caffeine_lower = estimate_caffeine_remaining(
        elimination_half_life_hours=lower_half_life,
        **common_kwargs,
    )

    _, caffeine_upper = estimate_caffeine_remaining(
        elimination_half_life_hours=upper_half_life,
        **common_kwargs,
    )

    x = np.arange(len(times))
    labels = [time.strftime("%H:%M") for time in times]

    lower_bound = np.minimum(caffeine_lower, caffeine_upper)
    upper_bound = np.maximum(caffeine_lower, caffeine_upper)

    plt.figure(figsize=(12, 5))

    plt.fill_between(
        x,
        lower_bound,
        upper_bound,
        alpha=0.25,
        label=(
            f"{lower_half_life:.1f}–{upper_half_life:.1f}h "
            "elimination half-life range"
        ),
    )

    plt.plot(
        x,
        caffeine_base,
        linewidth=2,
        label=f"{elimination_half_life_hours:.1f}h elimination half-life",
    )

    tick_every = max(1, int(60 / step_minutes))

    plt.xticks(
        x[::tick_every],
        labels[::tick_every],
        rotation=45,
    )

    plt.axhline(
        reference_threshold_mg,
        linestyle="--",
        linewidth=1,
        label=f"{reference_threshold_mg:.0f} mg personal reference threshold",
    )

    plt.xlabel("Time")
    plt.ylabel("Estimated active caffeine remaining in body (mg)")
    plt.title("Estimated active caffeine remaining with absorption delay")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    intakes = [
        ["07:00", "07:10", 180],
        # ["14:00", "14:10", 30],
    ]

    plot_caffeine_remaining(
        intakes=intakes,
        elimination_half_life_hours=6.0,
        half_life_range_hours=1.0,
        absorption_half_life_minutes=30.0,
        plot_start="06:00",
        plot_end="24:00",
        step_minutes=1.0,
        reference_threshold_mg=20.0,
    )
