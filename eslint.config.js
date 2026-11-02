import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'pnpm-lock.yaml'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 规格书 2.1：禁止 any，唯一例外是 Record<string, unknown>
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // 测试里的假实现常常是「同步返回包一层 Promise」，没有 await 是正常的
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // 配置文件与构建脚本不在 tsconfig 范围内，关掉类型检查规则；
    // 它们是 Node 脚本，需要显式声明全局变量，否则 no-undef 会误报
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
      },
    },
  },
);
