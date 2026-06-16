#!/usr/bin/env python3
"""
energy_tool.py

Strict energy conversion, first-order Redhead TPD desorption-energy calculator,
and ASE-based thermochemistry correction helper.

Scope intentionally excluded:
    - electrochemical voltage / potential conversion
    - redox free-energy relations such as ΔG = -nFE
    - electron-number-dependent electrochemical interpretation

Authoritative references encoded in the implementation comments:
    1. NIST/CODATA 2022 recommended values of the fundamental physical constants
       https://physics.nist.gov/cuu/Constants/
       https://physics.nist.gov/cuu/pdf/wallet_2022.pdf

    2. ASE thermochemistry implementation and documentation
       https://ase-lib.org/ase/thermochemistry/thermochemistry.html
       ASE Thermochemistry uses vibrational energies in eV and evaluates ideal-gas
       or harmonic-limit corrections. In ASE units, eV is the internal energy unit.

    3. Redhead first-order thermal desorption analysis
       P. A. Redhead, "Thermal desorption of gases", Vacuum 12, 203-211 (1962).
       Standard first-order Redhead form:
           E_des = R T_p [ ln(ν T_p / β) - 3.64 ]
       for first-order desorption with E_des/(R T_p) sufficiently large.

Numerical convention:
    - Internally, ordinary energy conversion uses joules per particle.
    - Molar quantities are obtained by multiplying/dividing by Avogadro's constant.
    - Spectroscopic equivalents use E = hν = hc/λ = hc\tilde{ν}.
    - Redhead output is naturally molar, E_des in J mol^-1, and then converted to
      eV per molecule using 1 eV per molecule = 96485.3321233100184 J mol^-1.
    - Thermochemistry frequencies are converted to vibrational quantum energies in eV
      before being passed to ASE: E_vib = h c \tilde{ν}; 1 cm^-1 = 100 m^-1.
    - Frequency conversion uses \tilde{ν} = ν/c. Since c is in m s^-1,
      \tilde{ν}[cm^-1] = ν[Hz] / (100 c[m s^-1]).
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, getcontext
from typing import Dict, Iterable, List, Sequence, Tuple


# Decimal precision far exceeds the significant figures of CODATA constants used here.
# This suppresses avoidable intermediate roundoff while not implying extra physical accuracy.
getcontext().prec = 50


# =============================================================================
# Constants
# =============================================================================

# Exact SI constants after the 2019 SI redefinition; tabulated by NIST/CODATA 2022.
C = Decimal("299792458")                  # speed of light in vacuum, m s^-1, exact
H = Decimal("6.62607015e-34")             # Planck constant, J s, exact
K_B = Decimal("1.380649e-23")             # Boltzmann constant, J K^-1, exact
N_A = Decimal("6.02214076e23")            # Avogadro constant, mol^-1, exact
E_CHARGE = Decimal("1.602176634e-19")     # elementary charge, C, exact

# Derived exact constants.
EV_J = E_CHARGE                           # 1 eV = e joule, exact
R = N_A * K_B                             # molar gas constant, J mol^-1 K^-1, exact from N_A and k_B
EV_MOLAR_J = EV_J * N_A                   # J mol^-1 per eV per molecule, exact from e and N_A

# CODATA 2022 adjusted value, not exact. NIST tabulates the Hartree energy and related conversions.
# The value below is the Hartree energy in eV from CODATA 2022.
HARTREE_EV = Decimal("27.211386245981")
HARTREE_J = HARTREE_EV * EV_J

# Thermochemical calorie by definition.
CAL_J = Decimal("4.184")
KCAL_J = Decimal("4184")

# Redhead first-order constant for the usual analytical approximation.
# It appears in E_des = R T_p [ln(ν T_p / β) - 3.64].
REDHEAD_FIRST_ORDER_CONSTANT = Decimal("3.64")


# =============================================================================
# Unit handling
# =============================================================================

UNIT_ALIASES: Dict[str, str] = {
    # Energy per particle
    "j": "J",
    "joule": "J",
    "joules": "J",
    "ev": "eV",
    "electronvolt": "eV",
    "electronvolts": "eV",
    "eh": "Eh",
    "ha": "Eh",
    "hartree": "Eh",
    "hartrees": "Eh",

    # Energy per mole
    "j/mol": "J/mol",
    "jmol": "J/mol",
    "kj/mol": "kJ/mol",
    "kjmol": "kJ/mol",
    "kcal/mol": "kcal/mol",
    "kcalmol": "kcal/mol",

    # Spectroscopic wavenumber
    "m^-1": "m^-1",
    "m-1": "m^-1",
    "1/m": "m^-1",
    "cm^-1": "cm^-1",
    "cm-1": "cm^-1",
    "1/cm": "cm^-1",
    "wavenumber": "cm^-1",

    # Frequency
    "hz": "Hz",
    "s^-1": "Hz",
    "s-1": "Hz",
    "thz": "THz",

    # Wavelength
    "m": "m",
    "nm": "nm",
    "nanometer": "nm",
    "nanometers": "nm",

    # Temperature equivalent, E = k_B T
    "k": "K",
    "kelvin": "K",
}


@dataclass(frozen=True)
class ConversionResult:
    input_value: Decimal
    input_unit: str
    temperature_K: Decimal
    energy_J_per_particle: Decimal
    values: Dict[str, Decimal]
    notes: Tuple[str, ...]


@dataclass(frozen=True)
class RedheadResult:
    Tp_K: Decimal
    beta_K_s: Decimal
    nu_s_inv: Decimal
    log_argument: Decimal
    ln_log_argument: Decimal
    E_J_mol: Decimal
    E_kJ_mol: Decimal
    E_kcal_mol: Decimal
    E_eV_per_molecule: Decimal
    notes: Tuple[str, ...]


@dataclass(frozen=True)
class ThermochemistryResult:
    mode: str
    temperature_K: Decimal
    pressure_Pa: Decimal | None
    frequency_unit: str
    frequencies_input: Tuple[Decimal, ...]
    frequencies_cm_inv_used: Tuple[Decimal, ...]
    vib_energies_eV: Tuple[Decimal, ...]
    values_eV: Dict[str, Decimal | str | None]
    notes: Tuple[str, ...]


def decimal_from_string(text: str, name: str) -> Decimal:
    try:
        value = Decimal(text)
    except InvalidOperation as exc:
        raise ValueError(f"{name} must be a valid decimal number: {text!r}") from exc
    if value.is_nan():
        raise ValueError(f"{name} must not be NaN.")
    return value


def normalize_unit(unit: str) -> str:
    key = unit.strip().lower().replace(" ", "")
    try:
        return UNIT_ALIASES[key]
    except KeyError as exc:
        allowed = ", ".join(sorted(set(UNIT_ALIASES.values())))
        raise ValueError(f"Unsupported unit {unit!r}. Allowed canonical units: {allowed}") from exc


# =============================================================================
# Energy conversion formulas
# =============================================================================

def to_joule_per_particle(value: Decimal, unit: str) -> Decimal:
    """
    Convert the input value to joules per particle.

    Formula map:
        J:
            E_J = value

        eV:
            E_J = value * e
            because 1 eV = 1.602176634e-19 J exactly.

        Eh:
            E_J = value * E_h

        molar energy:
            E_J = E_molar / N_A

        wavenumber:
            E = h c \tilde{ν}
            with \tilde{ν} in m^-1.
            cm^-1 is converted to m^-1 by multiplying by 100.

        frequency:
            E = hν

        wavelength:
            E = hc/λ
            λ must be positive.

        temperature equivalent:
            E = k_B T
    """
    if unit == "J":
        return value
    if unit == "eV":
        return value * EV_J
    if unit == "Eh":
        return value * HARTREE_J
    if unit == "J/mol":
        return value / N_A
    if unit == "kJ/mol":
        return value * Decimal("1000") / N_A
    if unit == "kcal/mol":
        return value * KCAL_J / N_A
    if unit == "m^-1":
        return H * C * value
    if unit == "cm^-1":
        return H * C * value * Decimal("100")
    if unit == "Hz":
        return H * value
    if unit == "THz":
        return H * value * Decimal("1e12")
    if unit == "m":
        if value <= 0:
            raise ValueError("Wavelength must be positive.")
        return H * C / value
    if unit == "nm":
        if value <= 0:
            raise ValueError("Wavelength must be positive.")
        return H * C / (value * Decimal("1e-9"))
    if unit == "K":
        return K_B * value
    raise ValueError(f"Internal error: unsupported canonical unit {unit!r}")


def from_joule_per_particle(E: Decimal, temperature_K: Decimal) -> Tuple[Dict[str, Decimal], Tuple[str, ...]]:
    """
    Generate all supported equivalents from joules per particle.

    Sign convention:
        - Energy-like quantities preserve the sign.
        - Frequency and wavenumber preserve the sign as mathematical equivalents.
        - Wavelength is reported using |E| because a physical photon wavelength is
          positive and corresponds to a positive photon energy.
    """
    notes = []
    abs_E = abs(E)

    values = {
        "J": E,
        "eV": E / EV_J,
        "Eh": E / HARTREE_J,
        "J/mol": E * N_A,
        "kJ/mol": E * N_A / Decimal("1000"),
        "kcal/mol": E * N_A / KCAL_J,
        "m^-1": E / (H * C),
        "cm^-1": E / (H * C) / Decimal("100"),
        "Hz": E / H,
        "THz": E / H / Decimal("1e12"),
        "K": E / K_B,
        "E/kBT": E / (K_B * temperature_K),
    }

    if E == 0:
        values["m"] = Decimal("Infinity")
        values["nm"] = Decimal("Infinity")
        notes.append("Zero energy corresponds to infinite wavelength.")
    else:
        values["m"] = H * C / abs_E
        values["nm"] = H * C / abs_E / Decimal("1e-9")
        if E < 0:
            notes.append(
                "Negative energy: frequency and wavenumber are signed mathematical equivalents; "
                "wavelength is computed from |E|."
            )

    return values, tuple(notes)


def boltzmann_two_state(delta_E_J: Decimal, temperature_K: Decimal) -> Dict[str, Decimal]:
    """
    Two-state Boltzmann population for an energy gap.

    Convention:
        ΔE = E_high - E_low

    Equal-degeneracy ratio:
        N_high / N_low = exp(-ΔE / k_B T)

    Fractions:
        p_low  = 1 / [1 + exp(-ΔE/k_B T)]
        p_high = exp(-ΔE/k_B T) / [1 + exp(-ΔE/k_B T)]

    This interpretation is physically appropriate only when the input is an energy
    difference between two states and degeneracies are equal or intentionally ignored.
    """
    x = delta_E_J / (K_B * temperature_K)
    ratio = (-x).exp()
    denominator = Decimal("1") + ratio
    return {
        "DeltaE_over_kBT": x,
        "N_high_over_N_low": ratio,
        "p_low": Decimal("1") / denominator,
        "p_high": ratio / denominator,
    }


def convert_energy(value_text: str, unit_text: str, temperature_text: str) -> ConversionResult:
    value = decimal_from_string(value_text, "value")
    temperature_K = decimal_from_string(temperature_text, "temperature")
    if temperature_K <= 0:
        raise ValueError("Temperature must be positive in kelvin.")

    unit = normalize_unit(unit_text)
    E = to_joule_per_particle(value, unit)
    values, notes = from_joule_per_particle(E, temperature_K)

    return ConversionResult(
        input_value=value,
        input_unit=unit,
        temperature_K=temperature_K,
        energy_J_per_particle=E,
        values=values,
        notes=notes,
    )


# =============================================================================
# Redhead first-order TPD formulas
# =============================================================================

def redhead_first_order(
    Tp_K: Decimal,
    beta_K_s: Decimal,
    nu_s_inv: Decimal | None = None,
) -> RedheadResult:
    """
    First-order Redhead desorption-energy estimate.

    Polanyi-Wigner first-order desorption rate:
        -dθ/dt = ν θ exp(-E_des / R T)

    With linear heating:
        β = dT/dt

    For a first-order TPD peak at T_p, Redhead's common analytical approximation is:
        E_des = R T_p [ ln(ν T_p / β) - 3.64 ]

    If ν is not supplied, this script uses the transition-state-like thermal frequency:
        ν = k_B T_p / h

    Therefore, default mode evaluates:
        E_des = R T_p [ ln(k_B T_p^2 / hβ) - 3.64 ]

    Validity notes:
        - first-order desorption kinetics are assumed;
        - ν is assumed temperature-independent across the peak except when the default
          ν = k_B T_p/h is explicitly evaluated at T_p;
        - coverage dependence, readsorption, transport limitation, and non-first-order
          kinetics are not included;
        - the 3.64 approximation is the standard Redhead approximation and is not a
          replacement for full kinetic fitting when high accuracy is required.
    """
    if Tp_K <= 0:
        raise ValueError("Tp_K must be positive.")
    if beta_K_s <= 0:
        raise ValueError("beta_K_s must be positive.")

    notes = []

    if nu_s_inv is None:
        nu_s_inv = K_B * Tp_K / H
        notes.append("Prefactor was set by ν = k_B T_p / h.")
    elif nu_s_inv <= 0:
        raise ValueError("nu_s_inv must be positive when supplied.")
    else:
        notes.append("Prefactor was supplied by the user; ν = k_B T_p / h was not used.")

    log_argument = nu_s_inv * Tp_K / beta_K_s
    if log_argument <= 0:
        raise ValueError("Redhead logarithm argument must be positive.")

    ln_log_argument = log_argument.ln()
    E_J_mol = R * Tp_K * (ln_log_argument - REDHEAD_FIRST_ORDER_CONSTANT)

    if E_J_mol <= 0:
        notes.append(
            "Computed E_des is non-positive. Check T_p, β, ν, and applicability of the Redhead approximation."
        )

    return RedheadResult(
        Tp_K=Tp_K,
        beta_K_s=beta_K_s,
        nu_s_inv=nu_s_inv,
        log_argument=log_argument,
        ln_log_argument=ln_log_argument,
        E_J_mol=E_J_mol,
        E_kJ_mol=E_J_mol / Decimal("1000"),
        E_kcal_mol=E_J_mol / KCAL_J,
        E_eV_per_molecule=E_J_mol / EV_MOLAR_J,
        notes=tuple(notes),
    )



# =============================================================================
# ASE thermochemistry helpers
# =============================================================================

# External dependency note:
#     ASE is intentionally imported lazily inside the thermochemistry routine so
#     ordinary unit conversion and Redhead calculations remain usable without ASE.
#
# Unit provenance and method verification:
#     - ASE Thermochemistry expects vibrational energies in eV.
#     - Frequencies reported by electronic-structure codes are commonly harmonic
#       wavenumbers in cm^-1. They are converted with E = h c \tilde{ν}.
#     - True temporal frequencies in Hz are converted to wavenumbers by
#       \tilde{ν}[cm^-1] = ν[Hz] / (100 c[m s^-1]), then to eV.
#     - IdealGasThermo assumes separable ideal-gas translational, rotational, and
#       vibrational terms. It requires molecular geometry, atomic masses and
#       moments of inertia, external symmetry number, and spin degeneracy.
#     - HarmonicThermo treats all supplied modes as harmonic vibrational modes;
#       it is the usual approximation for adsorbates with frustrated translations
#       and rotations treated as vibrations.
#     - potentialenergy is set to 0.0 eV so returned ASE values are corrections
#       relative to the electronic energy E_elec, not total absolute energies.
#
# Important limitation:
#     Symmetry numbers below are rotational symmetry numbers used in ideal-gas
#     rotational entropy, not the order of the full point group. The mapping is
#     valid only for common rigid molecules and should be audited for unusual
#     fluxional, isotopically substituted, or low-symmetry structures.

POINT_GROUP_SYMMETRY_NUMBER: Dict[str, int] = {
    # Linear molecules.
    "Cinfv": 1,   # heteronuclear linear molecule, e.g. CO
    "Dinfh": 2,   # homonuclear or centrosymmetric linear molecule, e.g. CO2, N2

    # Common finite molecular rotational symmetry numbers.
    "C1": 1,
    "Cs": 1,
    "Ci": 1,
    "C2": 2,
    "C2v": 2,
    "C3v": 3,
    "C4v": 4,
    "C5v": 5,
    "C6v": 6,
    "D2h": 4,
    "D3h": 6,
    "D4h": 8,
    "D5h": 10,
    "D6h": 12,
    "D2d": 4,
    "D3d": 6,
    "Td": 12,
    "Oh": 24,
    "Ih": 60,
}


def normalize_point_group(point_group: str) -> str:
    """Normalize common point-group spellings without changing chemical meaning."""
    pg = point_group.strip()
    pg = pg.replace("∞", "inf")
    pg = pg.replace("_", "")
    pg = pg.replace("-", "")
    return pg


def get_symmetry_number(point_group: str) -> int:
    """Return the external rotational symmetry number for a supported point group."""
    pg = normalize_point_group(point_group)
    if pg not in POINT_GROUP_SYMMETRY_NUMBER:
        raise ValueError(
            f"Unknown point group: {point_group}. Add the corresponding rotational "
            "symmetry number to POINT_GROUP_SYMMETRY_NUMBER after checking the molecule."
        )
    return POINT_GROUP_SYMMETRY_NUMBER[pg]


def hz_to_cm_inv(freq_hz: Decimal) -> Decimal:
    """
    Convert temporal frequency ν in Hz = s^-1 to spectroscopic wavenumber cm^-1.

    Derivation:
        wavelength λ = c / ν
        wavenumber in m^-1 = 1/λ = ν/c
        wavenumber in cm^-1 = (ν/c) / 100

    c = 299792458 m s^-1 is exact in SI, so this conversion is exact apart from
    the significant figures of the supplied frequency.
    """
    return freq_hz / (C * Decimal("100"))


def thz_to_cm_inv(freq_thz: Decimal) -> Decimal:
    """Convert THz to cm^-1 via Hz to avoid hard-coded rounded factors."""
    return hz_to_cm_inv(freq_thz * Decimal("1e12"))


def cm_inv_to_ev_decimal(freq_cm_inv: Decimal) -> Decimal:
    """
    Convert harmonic wavenumber cm^-1 to vibrational quantum energy in eV.

    E[eV] = h c (100 cm^-1 per m^-1) * \tilde{ν}[cm^-1] / e.
    h, c, and e are exact SI constants after the 2019 SI redefinition.
    """
    return H * C * Decimal("100") * freq_cm_inv / EV_J


def frequencies_to_cm_inv(
    frequencies: Sequence[str | Decimal | float | int],
    unit: str,
    ignore_imag_modes: bool,
) -> Tuple[Tuple[Decimal, ...], Tuple[str, ...]]:
    """Normalize frequency-like input to positive real cm^-1 values for ASE."""
    canonical = normalize_frequency_unit(unit)
    notes: List[str] = []
    out: List[Decimal] = []

    for i, x in enumerate(frequencies, start=1):
        value = Decimal(str(x)) if not isinstance(x, Decimal) else x
        if value.is_nan():
            raise ValueError(f"Frequency #{i} must not be NaN.")

        # Negative frequencies in common quantum-chemistry output denote imaginary
        # modes after sign-convention post-processing. ASE can ignore imaginary
        # modes, but here we filter them explicitly so cm^-1/Hz input stays real
        # and auditable.
        if value < 0:
            if ignore_imag_modes:
                notes.append(f"Ignored negative/imaginary mode #{i}: {value} {canonical}.")
                continue
            raise ValueError(
                f"Frequency #{i} is negative ({value} {canonical}); set ignore_imag_modes=True "
                "only if this is an intended imaginary-mode filter."
            )

        if canonical == "cm^-1":
            cm_inv = value
        elif canonical == "Hz":
            cm_inv = hz_to_cm_inv(value)
        elif canonical == "THz":
            cm_inv = thz_to_cm_inv(value)
        else:
            raise ValueError(f"Internal error: unsupported frequency unit {canonical!r}")
        out.append(cm_inv)

    if not out:
        raise ValueError("No real vibrational modes remain after filtering.")
    return tuple(out), tuple(notes)


def normalize_frequency_unit(unit: str) -> str:
    key = unit.strip().lower().replace(" ", "")
    mapping = {
        "cm^-1": "cm^-1", "cm-1": "cm^-1", "1/cm": "cm^-1", "wavenumber": "cm^-1",
        "hz": "Hz", "s^-1": "Hz", "s-1": "Hz",
        "thz": "THz",
    }
    try:
        return mapping[key]
    except KeyError as exc:
        raise ValueError("frequency unit must be one of cm^-1, Hz, or THz.") from exc


def parse_frequency_list(text: str) -> Tuple[Decimal, ...]:
    """Parse comma/space/semicolon separated frequencies into Decimals."""
    raw = text.replace(",", " ").replace(";", " ").split()
    if not raw:
        raise ValueError("At least one frequency must be supplied.")
    return tuple(decimal_from_string(x, "frequency") for x in raw)


def parse_positions(text: str) -> List[List[float]]:
    """
    Parse positions as 'x,y,z;x,y,z;...'. ASE positions are in Å.

    The coordinate unit matters for moments of inertia in IdealGasThermo but not
    for the harmonic-only adsorbate approximation.
    """
    rows = []
    for row in text.split(";"):
        parts = [p.strip() for p in row.split(",") if p.strip()]
        if len(parts) != 3:
            raise ValueError("positions must use 'x,y,z;x,y,z;...' with exactly three coordinates per atom.")
        rows.append([float(decimal_from_string(p, "position")) for p in parts])
    return rows


def thermo_corrections(
    mode: str,
    frequencies: Sequence[str | Decimal | float | int],
    frequency_unit: str = "cm^-1",
    temperature_K: Decimal | str | float = Decimal("298.15"),
    pressure_Pa: Decimal | str | float = Decimal("101325"),
    atoms=None,
    geometry: str | None = None,
    point_group: str | None = None,
    symmetrynumber: int | None = None,
    spin: float = 0.0,
    ignore_imag_modes: bool = True,
) -> ThermochemistryResult:
    """
    Compute ASE thermochemistry corrections with explicit unit normalization.

    Parameters
    ----------
    mode:
        'ideal_gas' or 'harmonic'.
    frequencies:
        Harmonic vibrational frequencies/wavenumbers. For ideal-gas molecules,
        supply only the vibrational modes expected by ASE. With ASE's
        vib_selection='highest', extra modes are sorted and the highest 3N-5
        linear or 3N-6 nonlinear modes are retained.
    frequency_unit:
        'cm^-1', 'Hz', or 'THz'. Hz is converted by ν/(100c).
    temperature_K:
        Thermodynamic temperature in K.
    pressure_Pa:
        Ideal-gas pressure in Pa. Used only in ideal_gas mode.
    atoms:
        ASE Atoms object. Required for ideal_gas mode because mass and inertia
        enter translational and rotational terms.
    geometry:
        'monatomic', 'linear', or 'nonlinear'. Required for ideal_gas mode.
    point_group / symmetrynumber:
        Supply symmetrynumber directly for maximum rigor. point_group is a
        convenience lookup for common rotational symmetry numbers.
    spin:
        Total electronic spin S, where spin multiplicity is 2S + 1 in ASE.
    ignore_imag_modes:
        Negative frequencies are treated as imaginary-mode markers and filtered
        only when this flag is True.

    Returns
    -------
    ThermochemistryResult
        Corrections in eV relative to potentialenergy=0.0 eV.
    """
    try:
        from ase.thermochemistry import HarmonicThermo, IdealGasThermo
    except ImportError as exc:
        raise RuntimeError("ASE is required for thermochemistry: pip install ase") from exc

    T = Decimal(str(temperature_K)) if not isinstance(temperature_K, Decimal) else temperature_K
    P = Decimal(str(pressure_Pa)) if not isinstance(pressure_Pa, Decimal) else pressure_Pa
    if T <= 0:
        raise ValueError("temperature_K must be positive.")
    if P <= 0:
        raise ValueError("pressure_Pa must be positive.")

    freq_in = tuple(Decimal(str(x)) if not isinstance(x, Decimal) else x for x in frequencies)
    freq_cm_inv, freq_notes = frequencies_to_cm_inv(freq_in, frequency_unit, ignore_imag_modes)
    vib_energies_dec = tuple(cm_inv_to_ev_decimal(x) for x in freq_cm_inv)
    vib_energies_float = [float(x) for x in vib_energies_dec]
    notes: List[str] = list(freq_notes)
    notes.append("ASE received vibrational energies in eV computed from exact h, c, and e constants.")

    if mode == "ideal_gas":
        if atoms is None:
            raise ValueError("ideal_gas mode requires an ASE Atoms object.")
        if geometry not in {"monatomic", "linear", "nonlinear"}:
            raise ValueError("ideal_gas geometry must be 'monatomic', 'linear', or 'nonlinear'.")
        if symmetrynumber is None:
            symmetrynumber = get_symmetry_number(point_group) if point_group is not None else 1
            if point_group is None:
                notes.append("No point group or symmetry number supplied; symmetrynumber=1 was used.")
        if symmetrynumber <= 0:
            raise ValueError("symmetrynumber must be a positive integer.")

        thermo = IdealGasThermo(
            vib_energies=vib_energies_float,
            potentialenergy=0.0,
            atoms=atoms,
            geometry=geometry,
            symmetrynumber=int(symmetrynumber),
            spin=spin,
            vib_selection="highest",
            ignore_imag_modes=ignore_imag_modes,
        )
        zpe = Decimal(str(thermo.get_ZPE_correction()))
        Hcorr = Decimal(str(thermo.get_enthalpy(float(T), verbose=False)))
        S = Decimal(str(thermo.get_entropy(float(T), float(P), verbose=False)))
        TS = T * S
        Gcorr = Decimal(str(thermo.get_gibbs_energy(float(T), float(P), verbose=False)))
        values: Dict[str, Decimal | str | None] = {
            "point_group": point_group,
            "symmetrynumber": Decimal(symmetrynumber),
            "E_to_EplusZPE": zpe,
            "E_to_H": Hcorr,
            "TS": TS,
            "E_to_G_HminusTS": Gcorr,
            "S_eV_per_K": S,
        }
        notes.append("Ideal-gas result includes translational, rotational, vibrational, symmetry, and spin terms as implemented in ASE.")
        return ThermochemistryResult("ideal_gas", T, P, normalize_frequency_unit(frequency_unit), freq_in, freq_cm_inv, vib_energies_dec, values, tuple(notes))

    if mode == "harmonic":
        thermo = HarmonicThermo(
            vib_energies=vib_energies_float,
            potentialenergy=0.0,
            ignore_imag_modes=ignore_imag_modes,
        )
        zpe = Decimal(str(thermo.get_ZPE_correction()))
        Ucorr = Decimal(str(thermo.get_internal_energy(float(T), verbose=False)))
        S = Decimal(str(thermo.get_entropy(float(T), verbose=False)))
        TS = T * S
        Fcorr = Decimal(str(thermo.get_helmholtz_energy(float(T), verbose=False)))
        values = {
            "E_to_EplusZPE": zpe,
            "E_to_U": Ucorr,
            "TS": TS,
            "E_to_F_UminusTS": Fcorr,
            "S_eV_per_K": S,
        }
        notes.append("Harmonic result treats every retained real mode as an independent harmonic oscillator.")
        return ThermochemistryResult("harmonic", T, None, normalize_frequency_unit(frequency_unit), freq_in, freq_cm_inv, vib_energies_dec, values, tuple(notes))

    raise ValueError("mode must be 'ideal_gas' or 'harmonic'.")


# =============================================================================
# Output formatting
# =============================================================================

def format_decimal(x: Decimal, sigfigs: int) -> str:
    if x.is_infinite():
        return "Infinity"
    if x == 0:
        return "0"
    return f"{x:.{sigfigs}E}"


def print_key_values(rows: Iterable[Tuple[str, Decimal | str]], sigfigs: int) -> None:
    for key, value in rows:
        if isinstance(value, Decimal):
            print(f"{key:24s} {format_decimal(value, sigfigs)}")
        else:
            print(f"{key:24s} {value}")


def print_conversion_report(result: ConversionResult, sigfigs: int) -> None:
    print("Energy conversion report")
    print("=" * 78)
    print_key_values(
        [
            ("input value", result.input_value),
            ("input unit", result.input_unit),
            ("temperature / K", result.temperature_K),
        ],
        sigfigs,
    )
    print("-" * 78)
    print_key_values(
        [(key, result.values[key]) for key in (
            "J", "eV", "Eh", "J/mol", "kJ/mol", "kcal/mol",
            "m^-1", "cm^-1", "Hz", "THz", "m", "nm", "K", "E/kBT",
        )],
        sigfigs,
    )
    print("-" * 78)
    print("Two-state Boltzmann interpretation")
    print("Assumption: ΔE = E_high - E_low, equal degeneracy")
    boltz = boltzmann_two_state(result.energy_J_per_particle, result.temperature_K)
    print_key_values(
        [
            ("DeltaE/kBT", boltz["DeltaE_over_kBT"]),
            ("N_high/N_low", boltz["N_high_over_N_low"]),
            ("p_low", boltz["p_low"]),
            ("p_high", boltz["p_high"]),
        ],
        sigfigs,
    )
    if result.notes:
        print("-" * 78)
        for note in result.notes:
            print(f"Note: {note}")
    print("=" * 78)


def print_redhead_report(result: RedheadResult, sigfigs: int) -> None:
    print("First-order Redhead TPD estimate")
    print("=" * 78)
    print("Model:     first-order desorption")
    print("Equation:  E_des = R T_p [ln(ν T_p / β) - 3.64]")
    print("Default ν: ν = k_B T_p / h unless --nu is supplied")
    print("-" * 78)
    print_key_values(
        [
            ("T_p / K", result.Tp_K),
            ("beta / K s^-1", result.beta_K_s),
            ("nu / s^-1", result.nu_s_inv),
            ("log argument", result.log_argument),
            ("ln(argument)", result.ln_log_argument),
        ],
        sigfigs,
    )
    print("-" * 78)
    print_key_values(
        [
            ("E_des / J mol^-1", result.E_J_mol),
            ("E_des / kJ mol^-1", result.E_kJ_mol),
            ("E_des / kcal mol^-1", result.E_kcal_mol),
            ("E_des / eV molecule^-1", result.E_eV_per_molecule),
        ],
        sigfigs,
    )
    if result.notes:
        print("-" * 78)
        for note in result.notes:
            print(f"Note: {note}")
    print("=" * 78)


def print_thermo_report(result: ThermochemistryResult, sigfigs: int) -> None:
    print("ASE thermochemistry correction report")
    print("=" * 78)
    print_key_values(
        [
            ("mode", result.mode),
            ("temperature / K", result.temperature_K),
            ("pressure / Pa", result.pressure_Pa if result.pressure_Pa is not None else "not used"),
            ("frequency unit", result.frequency_unit),
            ("number of modes used", Decimal(len(result.frequencies_cm_inv_used))),
        ],
        sigfigs,
    )
    print("-" * 78)
    print("Frequencies used after filtering / cm^-1")
    for i, value in enumerate(result.frequencies_cm_inv_used, start=1):
        print(f"mode {i:3d}                 {format_decimal(value, sigfigs)}")
    print("-" * 78)
    print("Vibrational quantum energies passed to ASE / eV")
    for i, value in enumerate(result.vib_energies_eV, start=1):
        print(f"mode {i:3d}                 {format_decimal(value, sigfigs)}")
    print("-" * 78)
    print_key_values(result.values_eV.items(), sigfigs)
    if result.notes:
        print("-" * 78)
        for note in result.notes:
            print(f"Note: {note}")
    print("=" * 78)


# =============================================================================
# CLI
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Strict energy converter, first-order Redhead TPD calculator, and ASE thermochemistry helper."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    convert_parser = subparsers.add_parser("convert", help="Convert energy units.")
    convert_parser.add_argument("value", help="Numerical value, e.g. 1.0")
    convert_parser.add_argument("unit", help="Input unit, e.g. eV, Eh, kJ/mol, cm^-1, nm, K")
    convert_parser.add_argument(
        "-T",
        "--temperature",
        default="298.15",
        help="Temperature in K for E/kBT and Boltzmann interpretation. Default: 298.15",
    )
    convert_parser.add_argument("--sigfigs", type=int, default=12, help="Printed significant figures.")

    redhead_parser = subparsers.add_parser("redhead", help="First-order Redhead TPD estimate.")
    redhead_parser.add_argument("Tp", help="TPD peak maximum temperature T_p in K.")
    redhead_parser.add_argument("beta", help="Linear heating rate β.")
    redhead_parser.add_argument(
        "--beta-unit",
        choices=("K/s", "K/min"),
        default="K/s",
        help="Heating-rate unit. Default: K/s.",
    )
    redhead_parser.add_argument(
        "--nu",
        default=None,
        help="Optional desorption prefactor ν in s^-1. If omitted, ν = k_B T_p / h.",
    )
    redhead_parser.add_argument("--sigfigs", type=int, default=12, help="Printed significant figures.")

    thermo_parser = subparsers.add_parser("thermo", help="ASE thermochemistry correction report.")
    thermo_parser.add_argument("mode", choices=("ideal_gas", "harmonic"), help="Thermochemistry model.")
    thermo_parser.add_argument("frequencies", help="Frequencies, e.g. '667 667 1333 2349'.")
    thermo_parser.add_argument(
        "--freq-unit",
        choices=("cm^-1", "Hz", "THz"),
        default="cm^-1",
        help="Input frequency unit. Default: cm^-1.",
    )
    thermo_parser.add_argument("-T", "--temperature", default="298.15", help="Temperature in K. Default: 298.15.")
    thermo_parser.add_argument("-P", "--pressure", default="101325", help="Pressure in Pa for ideal_gas. Default: 101325.")
    thermo_parser.add_argument("--symbols", help="ASE Atoms symbols for ideal_gas, e.g. CO2.")
    thermo_parser.add_argument("--positions", help="ASE positions in Å: 'x,y,z;x,y,z;...'. Required for ideal_gas CLI use.")
    thermo_parser.add_argument("--geometry", choices=("monatomic", "linear", "nonlinear"), help="Ideal-gas geometry.")
    thermo_parser.add_argument("--point-group", help="Point group used to infer rotational symmetry number, e.g. Dinfh.")
    thermo_parser.add_argument("--symmetrynumber", type=int, help="Rotational symmetry number; overrides --point-group.")
    thermo_parser.add_argument("--spin", type=float, default=0.0, help="Total electronic spin S. Default: 0.")
    thermo_parser.add_argument(
        "--keep-imag-modes",
        action="store_true",
        help="Do not filter negative frequencies. Negative real frequencies will then raise an error.",
    )
    thermo_parser.add_argument("--sigfigs", type=int, default=10, help="Printed significant figures.")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    try:
        if args.command == "convert":
            result = convert_energy(args.value, args.unit, args.temperature)
            print_conversion_report(result, args.sigfigs)
            return

        if args.command == "redhead":
            Tp_K = decimal_from_string(args.Tp, "Tp")
            beta = decimal_from_string(args.beta, "beta")
            beta_K_s = beta / Decimal("60") if args.beta_unit == "K/min" else beta
            nu_s_inv = decimal_from_string(args.nu, "nu") if args.nu is not None else None
            result = redhead_first_order(Tp_K=Tp_K, beta_K_s=beta_K_s, nu_s_inv=nu_s_inv)
            print_redhead_report(result, args.sigfigs)
            return

        if args.command == "thermo":
            atoms = None
            if args.mode == "ideal_gas":
                if not args.symbols or not args.positions:
                    raise ValueError("ideal_gas CLI use requires --symbols and --positions.")
                try:
                    from ase import Atoms
                except ImportError as exc:
                    raise RuntimeError("ASE is required for ideal_gas CLI use: pip install ase") from exc
                atoms = Atoms(args.symbols, positions=parse_positions(args.positions))
            result = thermo_corrections(
                mode=args.mode,
                frequencies=parse_frequency_list(args.frequencies),
                frequency_unit=args.freq_unit,
                temperature_K=decimal_from_string(args.temperature, "temperature"),
                pressure_Pa=decimal_from_string(args.pressure, "pressure"),
                atoms=atoms,
                geometry=args.geometry,
                point_group=args.point_group,
                symmetrynumber=args.symmetrynumber,
                spin=args.spin,
                ignore_imag_modes=not args.keep_imag_modes,
            )
            print_thermo_report(result, args.sigfigs)
            return

        raise ValueError(f"Unknown command: {args.command}")

    except (ValueError, RuntimeError) as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
