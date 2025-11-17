import React from 'react';
import { Text, View } from 'react-native';

/**
 * Helper function to convert basic Markdown syntax to React Native components
 * This renders formatted text directly in React Native without HTML
 *
 * Supported Markdown:
 * - **bold** -> Text with fontWeight: 'bold'
 * - *italic* -> Text with fontStyle: 'italic'
 * - `code` -> Text with monospace font
 * - # Header -> Larger text with bold
 * - ## Header -> Medium text with bold
 * - ### Header -> Small text with bold
 * - > Blockquote -> Indented text with left border
 * - Line breaks -> Separate Text components
 */
export function renderMarkdownAsReactNative(markdown: string, textColor?: string): React.ReactNode {
  if (!markdown) return null;

  const defaultColor = textColor || '#000000';

  // Split by line breaks first
  const lines = markdown.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => {
        // Handle blockquotes
        if (line.startsWith('> ')) {
          return (
            <View key={lineIndex} style={{ borderLeftWidth: 4, borderLeftColor: '#ccc', paddingLeft: 8, marginBottom: 4 }}>
              <Text style={{ color: defaultColor }}>
                {parseInlineMarkdown(line.substring(2), defaultColor)}
              </Text>
            </View>
          );
        }
        // Handle headers
        else if (line.startsWith('### ')) {
          return (
            <Text key={lineIndex} style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: defaultColor }}>
              {parseInlineMarkdown(line.substring(4), defaultColor)}
            </Text>
          );
        } else if (line.startsWith('## ')) {
          return (
            <Text key={lineIndex} style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: defaultColor }}>
              {parseInlineMarkdown(line.substring(3), defaultColor)}
            </Text>
          );
        } else if (line.startsWith('# ')) {
          return (
            <Text key={lineIndex} style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: defaultColor }}>
              {parseInlineMarkdown(line.substring(2), defaultColor)}
            </Text>
          );
        } else {
          // Regular line with inline formatting
          return (
            <Text key={lineIndex} style={{ marginBottom: lineIndex < lines.length - 1 ? 4 : 0, color: defaultColor }}>
              {parseInlineMarkdown(line, defaultColor)}
            </Text>
          );
        }
      })}
    </>
  );
}

/**
 * Parse inline markdown formatting within a line
 * Returns a flat array of strings and Text elements that React Native can render
 */
function parseInlineMarkdown(text: string, textColor: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  let key = 0;

  // Pattern matches: **bold**, *italic*, or `code`
  // Order matters: bold first (**...**), then italic (*...*), then code (`...`)
  const regex = /(\*\*[^\*]+\*\*|\*[^\*]+\*|`[^`]+`)/g;
  
  const textParts = text.split(regex).filter(Boolean);

  for (const part of textParts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const boldText = part.substring(2, part.length - 2);
      parts.push(
        <Text key={`bold-${key++}`} style={{ fontWeight: 'bold', color: textColor }}>
          {boldText}
        </Text>
      );
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      // Italic text
      const italicText = part.substring(1, part.length - 1);
      parts.push(
        <Text key={`italic-${key++}`} style={{ fontStyle: 'italic', color: textColor }}>
          {italicText}
        </Text>
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      // Code text
      const codeText = part.substring(1, part.length - 1);
      parts.push(
        <Text key={`code-${key++}`} style={{ fontFamily: 'monospace', backgroundColor: '#f0f0f0', paddingHorizontal: 2, borderRadius: 2, color: textColor }}>
          {codeText}
        </Text>
      );
    } else {
      // Plain text
      parts.push(part);
    }
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Alternative function to convert Markdown to a simple formatted string
 * Useful for plain text display with basic formatting indicators
 */
export function convertMarkdownToFormattedText(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Blockquote: > text -> [BLOCKQUOTE]text[/BLOCKQUOTE]
  text = text.replace(/^> (.*)$/gm, '[BLOCKQUOTE]$1[/BLOCKQUOTE]');

  // Bold: **text** -> [BOLD]text[/BOLD]
  text = text.replace(/\*\*(.*?)\*\*/g, '[BOLD]$1[/BOLD]');

  // Italic: *text* -> [ITALIC]text[/ITALIC]
  text = text.replace(/\*(.*?)\*/g, '[ITALIC]$1[/ITALIC]');

  // Code: `text` -> [CODE]text[/CODE]
  text = text.replace(/`(.*?)`/g, '[CODE]$1[/CODE]');

  return text;
}