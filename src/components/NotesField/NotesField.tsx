import linkifyHtml from 'linkify-html';
import { init } from 'linkifyjs';
import React, { useCallback, useEffect, useState } from 'react';
import ContentEditable, { type ContentEditableEvent } from 'react-contenteditable';
import sanitizeHtml from 'sanitize-html';
import { emojify } from '../../utility/emojify';
import './NotesField.css';

export interface NotesFieldProps {
  className?: string
  placeholder?: string
  initialValue?: string
  onBlur: (transformedNotes: string) => void
}

const allowedHtmlTags = sanitizeHtml.defaults.allowedTags.concat(['img', 'a']);
const allowedHtmlAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  img: ['class', 'src'],
  a: ['href', 'contenteditable']
};

const sanitizeAndEmojifyInput = (input?: string): string => {
  if (input === undefined) {
    return '';
  }

  const sanitizedHtml = sanitizeHtml(input, {
    allowedTags: allowedHtmlTags,
    allowedAttributes: allowedHtmlAttributes
  });
  return emojify(sanitizedHtml);
};

const linkifyInput = (input: string): string => {
  return linkifyHtml(input, {
    attributes: {
      contenteditable: false
    },
    defaultProtocol: 'https'
  });
};

const formatInput = (input?: string): string => {
  return linkifyInput(sanitizeAndEmojifyInput(input));
};

export const NotesField = ({ className, placeholder, initialValue, onBlur }: NotesFieldProps): JSX.Element => {
  const [formattedNotes, setFormattedNotes] = useState<string>(formatInput(initialValue) ?? '');

  const onNotesFieldChange = useCallback(
    (event: ContentEditableEvent) => {
      if (event.currentTarget.innerHTML === null || event.currentTarget.innerHTML === undefined) {
        return;
      }

      setFormattedNotes(sanitizeAndEmojifyInput(event.currentTarget.innerHTML));
    },
    []
  );

  useEffect(() => {
    setFormattedNotes(formatInput(initialValue));
  }, [initialValue]);

  const onNotesFieldBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.innerHTML === null || event.currentTarget.innerHTML === undefined) {
        return;
      }

      onBlur(formatInput(event.currentTarget.innerHTML));
    },
    []
  );

  return (
    <ContentEditable
      className={`notes-field ${className ?? ''}`}
      placeholder={placeholder}
      html={formattedNotes}
      onChange={onNotesFieldChange}
      onBlur={onNotesFieldBlur}
    />
  );
};
