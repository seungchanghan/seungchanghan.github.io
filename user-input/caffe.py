from datetime import datetime, timedelta
import numpy as np
import matplotlib.pyplot as plt


def parse_time(t: str, base_date="2026-01-01") -> datetime:
    if t == "24:00":
        return datetime.fromisoformat(f"{base_date} 00:00") + timedelta(days=1)
    return datetime.fromisoformat(f"{base_date} {t}")


def caffeine_curve_with_absorption(
    intakes,
    elimination_half_life_hours=6,
    absorption_half_life_minutes=20,
    plot_start="06:00",
    plot_end="24:00",
    step_minutes=1,
    base_date="2026-01-01",
):
    """
    intakes: list of [start, end, dose_mg]

    모델:
        gut   --ka-->   blood   --ke--> eliminated

    - start~end 동안 dose_mg가 균등하게 gut으로 들어감
    - gut에서 blood로 1차 흡수
    - blood에서 1차 제거
    """

    ke = np.log(2) / elimination_half_life_hours
    ka = np.log(2) / (absorption_half_life_minutes / 60)

    start_dt = parse_time(plot_start, base_date)
    end_dt = parse_time(plot_end, base_date)

    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    n_steps = int((end_dt - start_dt).total_seconds() // (step_minutes * 60)) + 1
    times = [start_dt + timedelta(minutes=i * step_minutes) for i in range(n_steps)]

    blood = np.zeros(n_steps)
    gut = 0.0

    parsed_intakes = []

    for s, e, dose in intakes:
        s_dt = parse_time(s, base_date)
        e_dt = parse_time(e, base_date)

        if e_dt <= s_dt:
            e_dt += timedelta(days=1)

        duration_hours = (e_dt - s_dt).total_seconds() / 3600
        rate_mg_per_hour = dose / duration_hours

        parsed_intakes.append((s_dt, e_dt, rate_mg_per_hour))

    for i in range(1, n_steps):
        prev = times[i - 1]
        now = times[i]

        dt_hours = (now - prev).total_seconds() / 3600

        # 1) 이번 timestep 동안 마신 양을 gut에 추가
        ingested = 0.0

        for s_dt, e_dt, rate in parsed_intakes:
            overlap_start = max(prev, s_dt)
            overlap_end = min(now, e_dt)

            if overlap_end > overlap_start:
                overlap_hours = (overlap_end - overlap_start).total_seconds() / 3600
                ingested += rate * overlap_hours

        gut += ingested

        # 2) gut -> blood 흡수
        absorbed = gut * (1 - np.exp(-ka * dt_hours))
        gut -= absorbed

        # 3) blood 제거 + 흡수량 추가
        blood[i] = blood[i - 1] * np.exp(-ke * dt_hours) + absorbed

    return times, blood


if __name__ == "__main__":
    intakes = [
        ["07:00", "10:00", 180],
        #["14:00", "15:00", 30],
    ]

    times, caffeine_6h = caffeine_curve_with_absorption(
        intakes,
        elimination_half_life_hours=6,
        absorption_half_life_minutes=30,
        plot_start="06:00",
        plot_end="24:00",
        step_minutes=1,
    )

    _, caffeine_5h = caffeine_curve_with_absorption(
        intakes,
        elimination_half_life_hours=5,
        absorption_half_life_minutes=30,
        plot_start="06:00",
        plot_end="24:00",
        step_minutes=1,
    )

    _, caffeine_7h = caffeine_curve_with_absorption(
        intakes,
        elimination_half_life_hours=7,
        absorption_half_life_minutes=30,
        plot_start="06:00",
        plot_end="24:00",
        step_minutes=1,
    )

    x = np.arange(len(times))
    labels = [t.strftime("%H:%M") for t in times]

    lower = np.minimum(caffeine_5h, caffeine_7h)
    upper = np.maximum(caffeine_5h, caffeine_7h)

    plt.figure(figsize=(12, 5))

    plt.fill_between(
        x,
        lower,
        upper,
        alpha=0.25,
        label="5–7h elimination half-life range"
    )

    plt.plot(
        x,
        caffeine_6h,
        linewidth=2,
        label="6h elimination half-life"
    )

    tick_every = 60 // 1

    plt.xticks(
        x[::tick_every],
        labels[::tick_every],
        rotation=45
    )

    plt.xlabel("Time")
    plt.ylabel("Estimated caffeine in blood/body (mg)")
    plt.title("Estimated caffeine level with absorption delay")
    plt.grid(True, alpha=0.3)
    plt.hlines(20, min(x), max(x), colors='gray', linestyles='--')
    plt.legend()
    plt.tight_layout()
    plt.show()
