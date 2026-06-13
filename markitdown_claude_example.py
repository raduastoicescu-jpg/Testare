from markitdown import MarkItDown
import anthropic


def analyze_document(file_path: str, prompt: str = "Please summarize this document.") -> str:
    # Convert document to markdown
    md = MarkItDown()
    result = md.convert(file_path)
    markdown_text = result.text_content

    # Send to Claude
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=16000,
        thinking={"type": "adaptive"},
        messages=[
            {
                "role": "user",
                "content": f"Here is a document converted to markdown:\n\n{markdown_text}\n\n{prompt}",
            }
        ],
    )

    return response.content[-1].text


# Examples:
# analyze_document("report.pdf", "What are the key takeaways?")
# analyze_document("spreadsheet.xlsx", "Summarize the data trends.")
# analyze_document("presentation.pptx", "What is this presentation about?")
# analyze_document("https://example.com/article", "Extract the main points.")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python markitdown_claude_example.py <file_or_url> [prompt]")
        sys.exit(1)

    file_path = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else "Please summarize this document."
    print(analyze_document(file_path, prompt))
