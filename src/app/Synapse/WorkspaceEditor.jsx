'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Tema visual — fondo transparente para integrarse con el dark mode de la app
const appTheme = EditorView.theme({
    '&': {
        fontSize: '12.5px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        background: 'transparent',
        color: 'hsl(var(--foreground))',
        minHeight: '400px',
    },
    '.cm-content': {
        padding: '0',
        caretColor: '#a78bfa',
        lineHeight: '1.75',
    },
    '.cm-line': { padding: '0 2px' },
    '.cm-cursor': { borderLeftColor: '#a78bfa', borderLeftWidth: '2px' },
    '.cm-selectionBackground, ::selection': { background: '#a78bfa33 !important' },
    '.cm-focused': { outline: 'none' },
    '.cm-activeLine': { background: 'hsl(var(--foreground)/3%)' },
    '.cm-gutters': {
        background: 'transparent',
        border: 'none',
        color: 'hsl(var(--muted-foreground)/30%)',
        fontSize: '12px',
        paddingRight: '8px',
        minWidth: '32px',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 4px 0 8px' },
    // Bloques de código
    '.cm-codeBlock': {
        background: 'hsl(var(--foreground)/5%)',
        borderRadius: '4px',
        display: 'block',
    },
}, { dark: true });

// Colores para markdown + código
const mdHighlight = HighlightStyle.define([
    // Markdown headings
    { tag: tags.heading1, color: '#e5c07b', fontWeight: '700', fontSize: '1.3em' },
    { tag: tags.heading2, color: '#e5c07b', fontWeight: '600', fontSize: '1.15em' },
    { tag: tags.heading3, color: '#e5c07b', fontWeight: '600' },
    // Énfasis
    { tag: tags.strong,   color: 'hsl(var(--foreground))', fontWeight: '700' },
    { tag: tags.emphasis, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
    // Código
    { tag: tags.monospace,       color: '#a78bfa', background: 'hsl(var(--foreground)/8%)', borderRadius: '3px', padding: '0 3px' },
    { tag: tags.processingInstruction, color: '#a78bfa' },
    // Links
    { tag: tags.link,    color: '#61afef', textDecoration: 'underline' },
    { tag: tags.url,     color: '#61afef' },
    // Listas y citas
    { tag: tags.quote,   color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' },
    { tag: tags.list,    color: '#d19a66' },
    // Código dentro de bloques
    { tag: tags.keyword,          color: '#c678dd', fontWeight: '500' },
    { tag: tags.string,           color: '#98c379' },
    { tag: tags.number,           color: '#d19a66' },
    { tag: tags.comment,          color: '#6b737e', fontStyle: 'italic' },
    { tag: tags.variableName,     color: '#e06c75' },
    { tag: tags.typeName,         color: '#e5c07b' },
    { tag: tags.function(tags.variableName), color: '#61afef' },
    { tag: tags.operator,         color: '#56b6c2' },
    { tag: tags.punctuation,      color: '#abb2bf' },
    { tag: tags.propertyName,     color: '#56b6c2' },
    { tag: tags.attributeName,    color: '#e5c07b' },
    { tag: tags.bool,             color: '#d19a66' },
    { tag: tags.null,             color: '#d19a66' },
    { tag: tags.meta,             color: '#61afef' },
    { tag: tags.tagName,          color: '#e06c75' },
    { tag: tags.angleBracket,     color: '#abb2bf' },
    { tag: tags.self,             color: '#e06c75' },
    { tag: tags.className,        color: '#e5c07b' },
    { tag: tags.definition(tags.variableName), color: '#61afef' },
]);

export default function WorkspaceEditor({ value, onChange }) {
    const containerRef = useRef(null);
    const viewRef      = useRef(null);
    const onChangeRef  = useRef(onChange);
    onChangeRef.current = onChange;

    // Sincronizar valor externo si cambia sin que el usuario esté escribiendo
    const lastValueRef = useRef(value);

    useEffect(() => {
        if (!containerRef.current) return;

        const startState = EditorState.create({
            doc: value || '',
            extensions: [
                history(),
                drawSelection(),
                highlightActiveLine(),
                lineNumbers(),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                markdown({
                    base: markdownLanguage,
                    codeLanguages: languages,
                    addKeymap: true,
                }),
                syntaxHighlighting(mdHighlight),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                appTheme,
                EditorView.lineWrapping,
                EditorView.updateListener.of(update => {
                    if (update.docChanged) {
                        const newVal = update.state.doc.toString();
                        lastValueRef.current = newVal;
                        onChangeRef.current(newVal);
                    }
                }),
            ],
        });

        const view = new EditorView({ state: startState, parent: containerRef.current });
        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // Solo montar una vez
    }, []);

    // Actualizar contenido si el padre lo cambia externamente (ej: carga inicial)
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        if (value === lastValueRef.current) return;
        lastValueRef.current = value || '';
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: value || '' },
        });
    }, [value]);

    return (
        <div
            ref={containerRef}
            className="w-full min-h-[400px] rounded-lg border border-border/30 focus-within:border-violet-500/40 transition-colors overflow-hidden"
        />
    );
}
