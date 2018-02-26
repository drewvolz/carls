// @flow
import htmlparser from 'htmlparser2'
import cssSelect from 'css-select'
export {cssSelect}

export type HtmlElement = any
export type HtmlSoup = HtmlElement | Array<HtmlElement>

export function parseHtml(string: string): Object {
	return htmlparser.parseDOM(string, {
		withDomLvl1: true,
		normalizeWhitespace: false,
		xmlMode: false,
		decodeEntities: true,
	})
}

// from https://github.com/fb55/domutils/blob/master/lib/stringify.js
export function getText(elem: HtmlSoup): string {
	if (Array.isArray(elem)) return elem.map(getText).join('')
	if (elem.type === 'tag') return getText(elem.children)
	if (elem.type === 'text') return elem.data
	return ''
}

function getTextWithSpaces(elem: HtmlSoup): string {
	if (Array.isArray(elem)) return elem.map(getTextWithSpaces).join(' ')
	if (elem.type === 'tag') return getTextWithSpaces(elem.children)
	if (elem.type === 'text') return elem.data
	return ''
}

export function getTrimmedTextWithSpaces(elem: HtmlSoup): string {
	return getTextWithSpaces(elem)
		.split(/\s+/)
		.join(' ')
		.trim()
}

export function removeHtmlWithRegex(str: string): string {
	return str.replace(/<[^>]*>/g, ' ')
}

export function fastGetTrimmedText(str: string): string {
	return removeHtmlWithRegex(str)
		.replace(/\s+/g, ' ')
		.trim()
}
