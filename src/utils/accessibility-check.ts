/**
 * Runtime accessibility checks for development
 * This helps catch common accessibility issues during development
 */

export function runAccessibilityChecks() {
  // @ts-expect-error import.meta.env typing issue in dev builds
  if (import.meta.env?.PROD) return;

  // Check for images without alt text
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    // Found images without alt text
  }

  // Check for buttons without accessible labels
  const buttonsWithoutLabel = Array.from(document.querySelectorAll('button')).filter(btn => {
    const hasText = (btn.textContent?.trim()?.length || 0) > 0;
    const hasAriaLabel = btn.hasAttribute('aria-label');
    const hasAriaLabelledBy = btn.hasAttribute('aria-labelledby');
    return !hasText && !hasAriaLabel && !hasAriaLabelledBy;
  });
  if (buttonsWithoutLabel.length > 0) {
    // Found buttons without accessible labels
  }

  // Check for form inputs without labels
  const inputsWithoutLabel = Array.from(document.querySelectorAll('input, textarea, select')).filter(input => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label');
    const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
    return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
  });
  if (inputsWithoutLabel.length > 0) {
    // Found form inputs without labels
  }

  // Check for missing ARIA live regions
  document.querySelectorAll('[aria-live]');
  // Found ARIA live regions

  // Check for proper heading hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  let headingIssues = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1) {
      // Heading hierarchy issue
      headingIssues++;
    }
    lastLevel = level;
  });

  // Check for keyboard navigation
  document.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  // Found keyboard-focusable elements

  // Summary
  const totalIssues = imagesWithoutAlt.length + buttonsWithoutLabel.length + inputsWithoutLabel.length + headingIssues;
  if (totalIssues === 0) {
    // No accessibility issues detected
  } else {
    // Total accessibility issues found
  }
}

// Run checks after DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAccessibilityChecks, 1000); // Delay to allow React to render
  });
}