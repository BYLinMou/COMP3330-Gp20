import React from 'react';
import { Text, View, Linking, ScrollView } from 'react-native';

/**
 * Helper function to convert basic Markdown syntax to React Native components
 * This renders formatted text directly in React Native without HTML
 *
 * Supported Markdown:
 * - **bold** -> Text with fontWeight: 'bold'
 * - *italic* -> Text with fontStyle: 'italic'
 * - ***bold italic*** -> Text with both bold and italic
 * - `code` -> Text with monospace font
 * - # Header -> Larger text with bold
 * - ## Header -> Medium text with bold
 * - ### Header -> Small text with bold
 * - > Blockquote -> Indented text with left border
 * - [text](url) -> Clickable link
 * - | col1 | col2 | -> Table rows
 * - - item or * item -> Bullet list items
 * - 1. item -> Numbered list items
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
        // Handle table rows
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.split('|').filter(cell => cell.trim() !== '');
          // Skip separator lines (lines with only dashes and colons)
          if (cells.some(cell => !cell.trim().match(/^[:|\-]+$/))) {
            return (
              <View key={lineIndex} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 4 }}>
                {cells.map((cell, cellIndex) => (
                  <View key={cellIndex} style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: cellIndex < cells.length - 1 ? 1 : 0, borderRightColor: '#ddd' }}>
                    <Text style={{ color: defaultColor, fontSize: 12 }}>
                      {parseInlineMarkdown(cell.trim(), defaultColor)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          }
          return null;
        }
        // Handle numbered list items (1. item, 2. item, etc.)
        else if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+)\.\s(.*)$/);
          if (match) {
            const number = match[1];
            const itemText = match[2];
            return (
              <View key={lineIndex} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 12 }}>
                <Text style={{ color: defaultColor, marginRight: 8 }}>
                  {number}.
                </Text>
                <Text style={{ flex: 1, color: defaultColor }}>
                  {parseInlineMarkdown(itemText, defaultColor)}
                </Text>
              </View>
            );
          }
        }
        // Handle bullet list items (- item or * item, but not part of bold/italic)
        else if ((line.trim().startsWith('- ') || line.trim().startsWith('* ')) && !line.trim().startsWith('* ') || (line.trim().startsWith('* ') && line.trim().length > 2 && line.trim()[2] !== '*')) {
          const itemText = line.trim().replace(/^[-*]\s/, '');
          return (
            <View key={lineIndex} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 12 }}>
              <Text style={{ color: defaultColor, marginRight: 8 }}>•</Text>
              <Text style={{ flex: 1, color: defaultColor }}>
                {parseInlineMarkdown(itemText, defaultColor)}
              </Text>
            </View>
          );
        }
        // Handle blockquotes
        else if (line.startsWith('> ')) {
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
        } else if (line.trim() === '') {
          // Empty line
          return <View key={lineIndex} style={{ height: 4 }} />;
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
 * Supports: ***bold italic***, **bold**, *italic*, `code`, [link](url)
 */
function parseInlineMarkdown(text: string, textColor: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  let key = 0;

  // Pattern matches: [text](url), ***bold italic***, **bold**, *italic*, or `code`
  // Use non-capturing groups (?:...) to avoid capturing unwanted groups
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|(?:\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`[^`]+`))/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const linkText = match[2];
    const linkUrl = match[3];

    if (linkText && linkUrl) {
      // This is a link
      parts.push(
        <Text
          key={`link-${key++}`}
          style={{ color: '#0066cc', textDecorationLine: 'underline' }}
          onPress={() => {
            Linking.openURL(linkUrl).catch(err => console.warn('Failed to open URL:', err));
          }}
        >
          {linkText}
        </Text>
      );
    } else if (fullMatch.startsWith('***') && fullMatch.endsWith('***') && fullMatch.length > 6) {
      // Bold + Italic text
      const boldItalicText = fullMatch.substring(3, fullMatch.length - 3);
      parts.push(
        <Text key={`bolditalic-${key++}`} style={{ fontWeight: 'bold', fontStyle: 'italic', color: textColor }}>
          {boldItalicText}
        </Text>
      );
    } else if (fullMatch.startsWith('**') && fullMatch.endsWith('**') && fullMatch.length > 4) {
      // Bold text
      const boldText = fullMatch.substring(2, fullMatch.length - 2);
      parts.push(
        <Text key={`bold-${key++}`} style={{ fontWeight: 'bold', color: textColor }}>
          {boldText}
        </Text>
      );
    } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*') && fullMatch.length > 2) {
      // Italic text
      const italicText = fullMatch.substring(1, fullMatch.length - 1);
      parts.push(
        <Text key={`italic-${key++}`} style={{ fontStyle: 'italic', color: textColor }}>
          {italicText}
        </Text>
      );
    } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      // Code text
      const codeText = fullMatch.substring(1, fullMatch.length - 1);
      parts.push(
        <Text key={`code-${key++}`} style={{ fontFamily: 'monospace', backgroundColor: '#f0f0f0', paddingHorizontal: 2, borderRadius: 2, color: textColor }}>
          {codeText}
        </Text>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
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