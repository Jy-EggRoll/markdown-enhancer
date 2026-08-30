# Markdown Enhancer 演示

## GitHub 特殊引用块

> [!NOTE]
> 普通提示信息，左侧蓝色条。

> [!TIP]
> 小技巧 / 建议，左侧绿色条。

> [!IMPORTANT]
> 重要事项，左侧紫色（mauve）条。

> [!WARNING]
> 警告，左侧黄色条。

> [!CAUTION]
> 危险 / 禁止，左侧红色条。

> [!TIP]
> callout 内可嵌套代码块与列表：
>
> ```bash
> pnpm install
> pnpm compile
> ```
>
> - 列表项一
> - 列表项二

## 普通引用块

> 这是普通引用块（不应被当成 callout 处理）。

## 文本样式

**加粗**、*斜体*、***加粗斜体***、`行内代码`、~~删除线~~、[链接](https://github.com)。

## 列表

- 无序项一
- 无序项二
  - 嵌套子项
- 无序项三

1. 有序一
2. 有序二

## 任务列表

- [x] 已完成
- [ ] 未完成

## 表格

| 语法        | 说明     |
| ----------- | -------- |
| `# 标题`    | 标题     |
| `> 引用`    | 引用块   |
| ```` ``` ```` | 代码块   |

## 代码块（带语言名 → 顶部显示语言名 + 复制按钮）

```ts
interface User {
    id: number;
    name: string;
}

function greet(user: User): string {
    return `Hello, ${user.name}!`;
}
```

```python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## 代码块（无语言名 → 仅复制按钮，无语言标签）

```
plain text block
no language class here
```

---

分割线以上为演示内容。
