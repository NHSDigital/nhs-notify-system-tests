/* Custom ESLint rules enforcing product test standards */
'use strict';

function isTestCall(node) {
  return node.type === 'CallExpression' && node.callee && node.callee.name === 'test';
}

function getTestTitle(node) {
  if (!isTestCall(node)) return null;
  const firstArg = node.arguments[0];
  if (!firstArg) return null;
  if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') return firstArg.value;
  if (firstArg.type === 'TemplateLiteral') {
    // Reconstruct static portions only; if expressions present we still check prefix
    const raw = firstArg.quasis.map(q => q.value.cooked).join('${}');
    return raw;
  }
  return null;
}

function hasPrecedingComment(context, node, markerRegex) {
  const sourceCode = context.getSourceCode();
  const comments = sourceCode.getCommentsBefore(node) || [];
  return comments.some(c => markerRegex.test(c.value));
}

module.exports = {
  rules: {
    'test-title-prefix': {
      meta: {
        type: 'problem',
        docs: { description: "Test titles must start with 'should '" },
        messages: {
          missingPrefix: "Test title must start with 'should '."
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            if (!isTestCall(node)) return;
            const title = getTestTitle(node);
            if (title && !title.startsWith('should ')) {
              context.report({ node, messageId: 'missingPrefix' });
            }
          }
        };
      }
    },
    'test-timeout-limit': {
      meta: {
        type: 'problem',
        docs: { description: 'test.setTimeout must be <= 60000 unless annotated // allowable timeout' },
        messages: {
          tooLarge: 'test.setTimeout value exceeds 60000 ms (add // allowable timeout if intentionally larger).'
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            // match pattern: test.setTimeout(NUM)
            if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'test' && node.callee.property.name === 'setTimeout') {
              const arg = node.arguments[0];
              if (arg && arg.type === 'Literal' && typeof arg.value === 'number') {
                if (arg.value > 60000 && !hasPrecedingComment(context, node, /allowable timeout/)) {
                  context.report({ node, messageId: 'tooLarge' });
                }
              }
            }
          }
        };
      }
    },
    'no-direct-page-locator': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow direct page.locator(...) unless annotated // allowable direct locator' },
        messages: {
          directLocator: 'Direct page.locator usage without preceding // allowable direct locator comment.'
        }
      },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.type === 'MemberExpression' && node.callee.object && node.callee.property) {
              if (
                node.callee.object.name === 'page' &&
                node.callee.property.name === 'locator'
              ) {
                if (!hasPrecedingComment(context, node, /allowable direct locator/)) {
                  context.report({ node, messageId: 'directLocator' });
                }
              }
            }
          }
        };
      }
    }
  }
};
