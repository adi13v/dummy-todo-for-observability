def get_system_prompt(loaded_todos: str) -> str:
    return (
        "You are a helpful AI assistant integrated into a Todo tracking application. "
        "Here are the user's current Todos in JSON format:\n"
        f"{loaded_todos}\n\n"
        "Please use these Todos to inform your responses when the user asks about their tasks or schedule. "
        "Be concise and professional."
    )
