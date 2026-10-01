import random
import json
from pathlib import Path


# =========================================================
# DATA
# =========================================================

RACES = {
    "Human": {
        "speed": 30,
        "age": (18, 70)
    },

    "Elf": {
        "speed": 30,
        "age": (80, 500)
    },

    "Dwarf": {
        "speed": 25,
        "age": (40, 300)
    },

    "Halfling": {
        "speed": 25,
        "age": (20, 120)
    },

    "Half-Orc": {
        "speed": 30,
        "age": (16, 70)
    },

    "Tiefling": {
        "speed": 30,
        "age": (18, 100)
    }
}


RULES = json.loads((Path(__file__).parent / "game_rules.json").read_text(encoding="utf-8"))
CLASSES = RULES["classes"]


GENDERS = [
    "Male",
    "Female"
]


NAMES = {

    "Human": {
        "Male": [
            "Aldric",
            "Cedric",
            "Garrick",
            "Darian",
            "Edmund",
            "Roland"
        ],

        "Female": [
            "Elara",
            "Mira",
            "Nora",
            "Helena",
            "Isolde",
            "Clara"
        ]
    },

    "Elf": {
        "Male": [
            "Theren",
            "Aelar",
            "Erevan",
            "Varis",
            "Faelar"
        ],

        "Female": [
            "Lia",
            "Thalia",
            "Sylvara",
            "Naivara",
            "Aeris"
        ]
    },

    "Dwarf": {
        "Male": [
            "Borin",
            "Thorin",
            "Durgan",
            "Harbek",
            "Orsik"
        ],

        "Female": [
            "Vistra",
            "Helja",
            "Gunnloda",
            "Kathra",
            "Brynja"
        ]
    },

    "Halfling": {
        "Male": [
            "Milo",
            "Perrin",
            "Osborn",
            "Finn",
            "Roscoe"
        ],

        "Female": [
            "Lidda",
            "Seraphina",
            "Callie",
            "Vani",
            "Meri"
        ]
    },

    "Half-Orc": {
        "Male": [
            "Grom",
            "Thokk",
            "Dorn",
            "Karg",
            "Rogar"
        ],

        "Female": [
            "Baggi",
            "Emen",
            "Ovak",
            "Shautha",
            "Vola"
        ]
    },

    "Tiefling": {
        "Male": [
            "Akmenos",
            "Morthos",
            "Leucis",
            "Mordai",
            "Therai"
        ],

        "Female": [
            "Akta",
            "Bryseis",
            "Criella",
            "Orianna",
            "Nemeia"
        ]
    }
}


SURNAMES = [
    "Blackwood",
    "Ironheart",
    "Stormborn",
    "Ravencrest",
    "Ashford",
    "Thorn",
    "Silverhand",
    "Grimwood",
    "Redwater",
    "Moonfall"
]


BACKGROUNDS = [
    "Former Soldier",
    "City Guard",
    "Street Urchin",
    "Noble",
    "Merchant",
    "Hunter",
    "Sailor",
    "Scholar",
    "Mercenary",
    "Temple Acolyte",
    "Criminal",
    "Wandering Performer"
]


TRAITS = [
    "Brave",
    "Curious",
    "Sarcastic",
    "Paranoid",
    "Calm",
    "Hot-headed",
    "Arrogant",
    "Kind-hearted",
    "Suspicious",
    "Superstitious",
    "Optimistic",
    "Pessimistic",
    "Reckless",
    "Quiet",
    "Extremely talkative"
]


IDEALS = [
    "Freedom above all.",
    "Knowledge must be preserved.",
    "The weak must be protected.",
    "Power belongs to those strong enough to take it.",
    "Everyone deserves a second chance.",
    "Order is the foundation of civilization.",
    "Gold solves almost every problem.",
    "Family comes before everything.",
    "Justice must be served.",
    "Survival is all that matters."
]


BONDS = [
    "Would die to protect their family.",
    "Owes their life to an old friend.",
    "Protects a mysterious heirloom.",
    "Is searching for a missing sibling.",
    "Swore loyalty to an old commander.",
    "Will never abandon a companion.",
    "Is deeply attached to their hometown.",
    "Owes a dangerous criminal a large debt."
]


FLAWS = [
    "Cannot resist a challenge.",
    "Trusts people too easily.",
    "Never admits being wrong.",
    "Has a terrible temper.",
    "Is extremely greedy.",
    "Panics when trapped.",
    "Cannot keep a secret.",
    "Underestimates enemies.",
    "Drinks far too much.",
    "Will do almost anything for gold."
]


SECRETS = [
    "Deserted during a major battle.",
    "Is wanted in another kingdom.",
    "Accidentally killed an innocent person.",
    "Uses a false identity.",
    "Once worked for a criminal organization.",
    "Is secretly of noble blood.",
    "Stole the heirloom they claim to protect.",
    "Betrayed an old companion.",
    "Is being hunted by a mysterious cult.",
    "Knows the location of a hidden treasure."
]


# =========================================================
# DICE
# =========================================================

def roll_stat():

    rolls = [
        random.randint(1, 6)
        for _ in range(4)
    ]

    rolls.remove(min(rolls))

    return sum(rolls)


def modifier(stat):

    return (stat - 10) // 2


def modifier_text(value):

    if value >= 0:
        return f"+{value}"

    return str(value)


# =========================================================
# STATS
# =========================================================

def generate_stats(character_class, custom_stats=None):
    if character_class not in CLASSES:
        raise ValueError("Unknown class. Choose Fighter, Mage or Rogue.")
    stats = dict(CLASSES[character_class]["stats"] if custom_stats is None else custom_stats)
    creation = RULES["creation"]
    if set(stats) != {"STR", "DEX", "INT"}:
        raise ValueError("Only STR, DEX and INT are supported.")
    if any(type(v) is not int or not creation["stat_min"] <= v <= creation["stat_max"] for v in stats.values()):
        raise ValueError("Stats must be integers from 6 to 20.")
    if sum(stats.values()) != creation["stat_budget"]:
        raise ValueError("Stats must total 38 points.")
    return stats


# =========================================================
# CHARACTER GENERATION
# =========================================================

def generate_character(character_class=None, custom_stats=None):

    race = random.choice(list(RACES.keys()))

    if character_class is None:
        character_class = random.choice(list(CLASSES))
    if character_class == "Wizard":
        character_class = "Mage"  # Compatibility with the previous name.

    gender = random.choice(GENDERS)

    first_name = random.choice(
        NAMES[race][gender]
    )

    surname = random.choice(SURNAMES)

    name = f"{first_name} {surname}"

    age_range = RACES[race]["age"]

    age = random.randint(
        age_range[0],
        age_range[1]
    )

    stats = generate_stats(character_class, custom_stats)

    str_mod = modifier(stats["STR"])
    dex_mod = modifier(stats["DEX"])
    class_data = CLASSES[character_class]
    hp = max(RULES["combat"]["minimum_hp"], class_data["hp_base"] + str_mod)
    ac = 10 + dex_mod + class_data["armor_bonus"]

    character = {

        "Name": name,
        "Gender": gender,
        "Age": age,

        "Race": race,
        "Class": character_class,

        "Stats": stats,

        "HP": hp,
        "AC": ac,

        "Initiative": dex_mod,

        "Speed": RULES["combat"]["ap_per_turn"] * 5,
        "AP": RULES["combat"]["ap_per_turn"],
        "Focus": class_data["resource"]["max"],
        "Max Focus": class_data["resource"]["max"],
        "Stealth": dex_mod + class_data["stealth_modifier"],
        "Abilities": [dict(a) for a in class_data["abilities"]],

        "Proficiency": 2,

        "Armor": class_data["armor"],

        "Weapon": class_data["weapon"],

        "Weapon Damage": class_data["damage"],
        "Damage Stat": class_data["damage_stat"],
        "Damage Modifier": modifier(stats[class_data["damage_stat"]]),

        "Background": random.choice(BACKGROUNDS),

        "Trait": random.choice(TRAITS),

        "Ideal": random.choice(IDEALS),

        "Bond": random.choice(BONDS),

        "Flaw": random.choice(FLAWS),

        "Secret": random.choice(SECRETS)
    }

    return character


# =========================================================
# PRINT CHARACTER
# =========================================================

def print_character(c):

    print("\n")
    print("=" * 55)
    print("                 CHARACTER GENERATED")
    print("=" * 55)

    print()

    print(f"Name       : {c['Name']}")
    print(f"Gender     : {c['Gender']}")
    print(f"Age        : {c['Age']}")
    print(f"Race       : {c['Race']}")
    print(f"Class      : {c['Class']}")
    print(f"Background : {c['Background']}")

    print()

    print("-" * 55)
    print("ATTRIBUTES")
    print("-" * 55)

    order = [
        "STR",
        "DEX",
        "INT",
    ]

    for stat in order:

        value = c["Stats"][stat]

        mod = modifier(value)

        print(
            f"{stat:<4}: "
            f"{value:<2} "
            f"({modifier_text(mod)})"
        )

    print()

    print("-" * 55)
    print("COMBAT")
    print("-" * 55)

    print(f"HP          : {c['HP']}")
    print(f"Defense     : {c['AC']}")
    print(f"AP / turn   : {c['AP']}")
    print(f"Focus       : {c['Focus']} / {c['Max Focus']}")
    print(f"Stealth     : {modifier_text(c['Stealth'])}")

    print(
        f"Initiative  : "
        f"{modifier_text(c['Initiative'])}"
    )

    print(
        f"Speed       : "
        f"{c['Speed']} ft"
    )

    print(
        f"Proficiency : "
        f"+{c['Proficiency']}"
    )

    print()

    print("-" * 55)
    print("EQUIPMENT")
    print("-" * 55)

    print(
        f"Armor  : "
        f"{c['Armor']}"
    )

    print(
        f"Weapon : "
        f"{c['Weapon']}"
    )

    print(
        f"Damage : "
        f"{c['Weapon Damage']} {modifier_text(c['Damage Modifier'])} ({c['Damage Stat']})"
    )

    print()

    print("-" * 55)
    print("ABILITIES")
    for ability in c["Abilities"]:
        print(f"{ability['name']} | {ability['ap']} AP | {ability['resource_cost']} Focus")
        print(ability["effect"])
    print()
    print("ROLEPLAY")
    print("-" * 55)

    print(
        f"Trait  : "
        f"{c['Trait']}"
    )

    print(
        f"Ideal  : "
        f"{c['Ideal']}"
    )

    print(
        f"Bond   : "
        f"{c['Bond']}"
    )

    print(
        f"Flaw   : "
        f"{c['Flaw']}"
    )

    print()

    print("-" * 55)
    print("SECRET")
    print("-" * 55)

    print(c["Secret"])

    print()

    print("=" * 55)


# =========================================================
# MAIN
# =========================================================

def main():
    while True:
        print("\nDUNGEON CHARACTER GENERATOR")
        print("[1] Fighter  [2] Mage  [3] Rogue  [4] Random  [5] Exit")
        choice = input("> ").strip()
        if choice == "5":
            break
        options = {"1": "Fighter", "2": "Mage", "3": "Rogue", "4": None}
        if choice not in options:
            print("Invalid command.")
            continue
        stats = None
        if input("Default stats? [Enter=yes / c=custom]: ").strip().lower() == "c":
            try:
                values = [int(v) for v in input("STR DEX INT (total 38, each 6-20): ").split()]
                if len(values) != 3:
                    raise ValueError("Enter exactly three numbers.")
                stats = dict(zip(["STR", "DEX", "INT"], values))
            except ValueError as error:
                print(error)
                continue
        try:
            print_character(generate_character(options[choice], stats))
        except ValueError as error:
            print(error)


if __name__ == "__main__":
    main()
