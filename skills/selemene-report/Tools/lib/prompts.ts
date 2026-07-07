export function witnessPromptFor(reportType: string): string {
  switch (reportType) {
    case "birth":
      return "What in this birth-chart picture feels most familiar, and what feels like a question you have not finished asking?";
    case "compatibility":
      return "Where do you notice the space between you most clearly, and what might that gap be teaching both of you?";
    case "transit":
      return "Which of these moving patterns stirs the strongest response in you right now — curiosity, resistance, or relief?";
    case "witness":
      return "What is the one thing from this reading that feels most alive right now?";
    default:
      return "What do you notice as you sit with what this report named?";
  }
}
