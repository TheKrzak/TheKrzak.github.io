import sys

def main():
    name = "Aleksander"
    user_id = 57706

    python_version = sys.version.split()[0]
    python_path = sys.executable

    message = (
        f"Hello {name} ({user_id}). This environment is using Python version {python_version} "
        f"at location {python_path}."
    )

    print(message)


if __name__ == "__main__":
    main()