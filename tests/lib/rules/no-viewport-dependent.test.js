/**
 * @fileoverview Tests for no-viewport-dependent rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-viewport-dependent');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-viewport-dependent', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'window.innerWidth',
      filename: 'src/app.js'
    },
    {
      code: 'if (window.innerHeight > 768) { }',
      filename: 'src/responsive.js'
    },

    // Using fixed viewport sizes
    {
      code: 'cy.viewport(1280, 720)',
      filename: 'Viewport.cy.js'
    },
    {
      code: 'page.setViewportSize({ width: 1920, height: 1080 })',
      filename: 'playwright.spec.js'
    },
    {
      code: 'await browser.setWindowSize(1024, 768)',
      filename: 'webdriver.test.js'
    },

    // Using mocked values
    {
      code: 'Object.defineProperty(window, "innerWidth", { value: 1024 })',
      filename: 'MockWidth.test.js'
    },
    {
      code: 'jest.spyOn(window, "innerHeight", "get").mockReturnValue(768)',
      filename: 'MockHeight.test.js'
    },

    // Testing with specific breakpoints
    {
      code: 'const MOBILE_WIDTH = 375; cy.viewport(MOBILE_WIDTH, 667)',
      filename: 'MobileTest.cy.js'
    },
    {
      code: 'const DESKTOP_WIDTH = 1920; page.setViewportSize({ width: DESKTOP_WIDTH, height: 1080 })',
      filename: 'DesktopTest.spec.js'
    },

    // Non-viewport properties
    {
      code: 'element.offsetWidth',
      filename: 'ElementWidth.test.js'
    },
    {
      code: 'container.clientHeight',
      filename: 'ClientHeight.test.js'
    },
    {
      code: 'div.scrollWidth',
      filename: 'ScrollWidth.test.js'
    },

    // Using media query testing utilities
    {
      code: 'expect(element).toBeVisible({ media: "(min-width: 768px)" })',
      filename: 'MediaQuery.test.js'
    },
    {
      code: 'matchMedia("(max-width: 600px)").matches',
      filename: 'MatchMedia.test.js'
    },

    // Reading but not depending on values
    {
      code: 'console.log("Current width:", window.innerWidth)',
      filename: 'Logging.test.js'
    },
    {
      code: 'const debug = { width: window.innerWidth, height: window.innerHeight }',
      filename: 'Debug.test.js'
    }
  ],

  invalid: [
    // Direct window dimension checks
    {
      code: 'if (window.innerWidth > 768) { }',
      filename: 'WindowWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerWidth' }
      }]
    },
    {
      code: 'if (window.innerHeight < 600) { }',
      filename: 'WindowHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerHeight' }
      }]
    },
    {
      code: 'expect(window.innerWidth).toBeGreaterThan(1024)',
      filename: 'ExpectWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerWidth' }
      }]
    },
    {
      code: 'expect(window.innerHeight).toBeLessThan(768)',
      filename: 'ExpectHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerHeight' }
      }]
    },

    // window.outerWidth/outerHeight
    {
      code: 'if (window.outerWidth > 1280) { }',
      filename: 'OuterWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.outerWidth' }
      }]
    },
    {
      code: 'const height = window.outerHeight',
      filename: 'OuterHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.outerHeight' }
      }]
    },

    // screen dimensions
    {
      code: 'if (screen.width > 1920) { }',
      filename: 'ScreenWidth.test.js',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.width' }
      }]
    },
    {
      code: 'const screenHeight = screen.height',
      filename: 'ScreenHeight.test.js',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.height' }
      }]
    },
    {
      code: 'screen.availWidth > 1024',
      filename: 'AvailWidth.test.js',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.availWidth' }
      }]
    },
    {
      code: 'screen.availHeight < 768',
      filename: 'AvailHeight.test.js',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.availHeight' }
      }]
    },

    // visualViewport
    {
      code: 'if (visualViewport.width > 375) { }',
      filename: 'VisualWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'visualViewport.width' }
      }]
    },
    {
      code: 'visualViewport.height < 667',
      filename: 'VisualHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'visualViewport.height' }
      }]
    },

    // document.documentElement dimensions
    {
      code: 'document.documentElement.clientWidth > 768',
      filename: 'DocumentWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'document.documentElement.clientWidth' }
      }]
    },
    {
      code: 'document.documentElement.clientHeight < 600',
      filename: 'DocumentHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'document.documentElement.clientHeight' }
      }]
    },

    // document.body dimensions
    {
      code: 'document.body.clientWidth > 1024',
      filename: 'BodyWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'document.body.clientWidth' }
      }]
    },
    {
      code: 'document.body.clientHeight < 768',
      filename: 'BodyHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'document.body.clientHeight' }
      }]
    },

    // getBoundingClientRect on viewport elements
    {
      code: 'document.documentElement.getBoundingClientRect().width',
      filename: 'BoundingWidth.test.js',
      errors: [{
        messageId: 'avoidBoundingRect'
      }]
    },
    {
      code: 'document.body.getBoundingClientRect().height',
      filename: 'BoundingHeight.test.js',
      errors: [{
        messageId: 'avoidBoundingRect'
      }]
    },

    // Responsive breakpoint testing
    {
      code: 'const isMobile = window.innerWidth < 768',
      filename: 'MobileCheck.test.js',
      errors: [{
        messageId: 'useFixedViewport'
      }]
    },
    {
      code: 'const isDesktop = window.innerWidth >= 1024',
      filename: 'DesktopCheck.test.js',
      errors: [{
        messageId: 'useFixedViewport'
      }]
    },
    {
      code: 'if (window.innerWidth < 600) { expect(menu).not.toBeVisible() }',
      filename: 'ResponsiveMenu.test.js',
      errors: [{
        messageId: 'useFixedViewport'
      }]
    },

    // Variable assignments
    {
      code: 'const width = window.innerWidth; if (width > 768) { }',
      filename: 'VariableWidth.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerWidth' }
      }]
    },
    {
      code: 'const { innerHeight: height } = window; expect(height).toBeGreaterThan(600)',
      filename: 'DestructuredHeight.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerHeight' }
      }]
    },

    // Multiple violations
    {
      code: `
        if (window.innerWidth > 768 && window.innerHeight > 600) {
          expect(element).toBeVisible();
        }
        const screenSize = screen.width;
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerWidth' } },
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerHeight' } },
        { messageId: 'avoidScreenCheck', data: { property: 'screen.width' } }
      ]
    },

    // In test blocks
    {
      code: 'it("responds to viewport", () => { if (window.innerWidth > 768) { } })',
      filename: 'TestBlock.test.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerWidth' }
      }]
    },
    {
      code: 'test("screen size", () => { expect(screen.width).toBeGreaterThan(1024) })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.width' }
      }]
    },

    // Different test file extensions
    {
      code: 'window.innerWidth > 768',
      filename: 'Viewport.spec.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'window.innerWidth' }
      }]
    },
    {
      code: 'screen.height < 600',
      filename: 'test/screen.test.ts',
      errors: [{
        messageId: 'avoidScreenCheck',
        data: { property: 'screen.height' }
      }]
    },
    {
      code: 'document.documentElement.clientWidth',
      filename: '__tests__/document.js',
      errors: [{
        messageId: 'avoidViewportCheck',
        data: { property: 'document.documentElement.clientWidth' }
      }]
    },

    // Complex expressions
    {
      code: 'const aspectRatio = window.innerWidth / window.innerHeight',
      filename: 'AspectRatio.test.js',
      errors: [
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerWidth' } },
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerHeight' } }
      ]
    },
    {
      code: 'Math.min(window.innerWidth, window.innerHeight)',
      filename: 'MinDimension.test.js',
      errors: [
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerWidth' } },
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerHeight' } }
      ]
    },

    // Resize event handlers
    {
      code: 'window.addEventListener("resize", () => { if (window.innerWidth > 768) { } })',
      filename: 'ResizeEvent.test.js',
      errors: [{
        messageId: 'avoidResizeListener'
      }]
    },
    {
      code: 'window.onresize = () => { updateLayout(window.innerWidth) }',
      filename: 'OnResize.test.js',
      errors: [{
        messageId: 'avoidResizeListener'
      }]
    },

    // Orientation checks
    {
      code: 'if (window.innerWidth > window.innerHeight) { }',
      filename: 'Orientation.test.js',
      errors: [
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerWidth' } },
        { messageId: 'avoidViewportCheck', data: { property: 'window.innerHeight' } }
      ]
    },
    {
      code: 'const isLandscape = screen.width > screen.height',
      filename: 'Landscape.test.js',
      errors: [
        { messageId: 'avoidScreenCheck', data: { property: 'screen.width' } },
        { messageId: 'avoidScreenCheck', data: { property: 'screen.height' } }
      ]
    }
  ]
});