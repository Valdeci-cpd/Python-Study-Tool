# 🐍 Python Study Tool

Uma ferramenta web minimalista e elegante para estudar código Python com **comentários interativos e anotações personalizadas**.

## ✨ Recursos Principais

### 📝 Anotações Inteligentes
- **Marcar código**: Selecione múltiplas linhas e anote com botão direito do mouse
- **Visualizar anotações**: Passe o mouse sobre código marcado para ver dicas
- **Editar/Deletar**: Gerenciar anotações através do menu de contexto
- **Suporte a Markdown**: Formate suas anotações com **negrito**, *itálico* e `código`

### 💾 Persistência de Dados
- **Exportar**: Salve seu código e anotações em JSON com diálogo "Salvar Como"
- **Importar**: Carregue projetos salvos anteriormente

## 🎯 Casos de Uso

- 📚 **Estudar Python**: Acompanhe conceitos enquanto lê código
- 💭 **Fazer Anotações**: Adicione comentários sem editar o código original
- 📖 **Documentar**: Crie documentação visual do código
- 🔄 **Reutilizar**: Salve e carregue seus estudos posteriomente

![Ref](./assets/Python_Study_Tool.gif)


## 📝 Exemplo de Anotação

```python
def fibonacci(n):
    # Inicializa a sequência
    a, b = 0, 1
    # Gera números de Fibonacci até n
    while a < n:
        print(a, end=' ')
        a, b = b, a + b
```

**Anotação possível:**
```
Usa a `atribuição tupla` do Python para trocar valores - **muito elegante**!
*Complexidade: O(n) em tempo e O(1) em espaço.*
```

## 📄 Formato do Arquivo Exportado

```json
{
  "code": "def exemplo():\n    print('Olá')\n\nexemplo()",
  "annotations": [
    {
      "id": 1708946732145,
      "from": {"line": 0, "ch": 0},
      "to": {"line": 0, "ch": 11},
      "text": "Uma função simples"
    }
  ]
}
```

## 🔐 Privacidade

- ✅ Tudo funciona **localmente** no seu navegador
- ✅ **Nenhum dado** é enviado para servidores
- ✅ Suas anotações são **suas**

## 🤝 Contribuições

Esta ferramenta foi desenvolvida como um projeto educacional. Sugestões de melhorias são bem-vindas!

## 📜 Licença

Código-fonte disponível para uso educacional e pessoal.
