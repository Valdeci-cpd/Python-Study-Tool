// Inicialização do CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: 'python',
    theme: 'eclipse',
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    autofocus: true
});

// Forçar recalculo de layout após inicialização
setTimeout(() => {
    editor.refresh();
    // Log para confirmar que o editor foi inicializado
    console.log('CodeMirror iniciado com altura:', editor.getWrapperElement().offsetHeight, 'px');
}, 0);

// Recalcular tamanho do editor quando a janela é redimensionada
window.addEventListener('resize', () => {
    editor.refresh();
});

// Estado da aplicação
let annotations = [];           // { id, from, to, text, colorIndex }
let nextId = 1;
let currentPopupAnnotationId = null;

// Cores disponíveis para as anotações (cicla automaticamente)
const annotationColors = [
    '#fff9c4', // Amarelo suave
    '#ffcccb', // Vermelho suave
    '#c8e6c9', // Verde suave
    '#b3e5fc', // Azul suave
    '#f0bfff', // Roxo suave
    '#ffe082', // Laranja suave
    '#ffccfd', // Rosa suave
    '#a1d99b', // Verde claro
    '#9ecae1', // Azul claro
    '#fdd0a2'  // Laranja claro
];

// Elementos DOM
const btnAnnotate = document.getElementById('btn-annotate');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const importFile = document.getElementById('import-file');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const popupEdit = document.getElementById('popup-edit');
const popupDelete = document.getElementById('popup-delete');
const newPanel = document.getElementById('new-annotation-panel');
const newText = document.getElementById('new-annotation-text');
const saveBtn = document.getElementById('save-annotation');
const cancelBtn = document.getElementById('cancel-annotation');
const editPanel = document.getElementById('edit-annotation-panel');
const editText = document.getElementById('edit-annotation-text');
const saveEditBtn = document.getElementById('save-edit-annotation');
const cancelEditBtn = document.getElementById('cancel-edit-annotation');

// Utilitário para gerar ID simples
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Função para criar uma marcação no editor
function createMark(annotation) {
    // Obter a classe de cor baseado no índice
    const colorClass = `cm-mark-color-${annotation.colorIndex}`;
    const mark = editor.markText(
        annotation.from,
        annotation.to,
        { className: `cm-mark ${colorClass}`, attributes: { 'data-id': annotation.id } }
    );
    // Armazenar referência da marcação na anotação (para remoção)
    annotation.mark = mark;
}

// Atualizar todas as marcações (após import, por exemplo)
function renderAllMarks() {
    // Limpar todas as marcações existentes
    editor.getAllMarks().forEach(mark => mark.clear());
    // Recriar a partir do array
    annotations.forEach(ann => createMark(ann));
}

// Adicionar nova anotação
function addAnnotation(from, to, text) {
    const id = generateId();
    // Atribuir a próxima cor da lista (cicla entre as cores disponíveis)
    const colorIndex = annotations.length % annotationColors.length;
    const annotation = { id, from, to, text, colorIndex };
    annotations.push(annotation);
    createMark(annotation);
}

// Remover anotação pelo ID
function removeAnnotationById(id) {
    const index = annotations.findIndex(ann => ann.id === id);
    if (index !== -1) {
        const ann = annotations[index];
        if (ann.mark) ann.mark.clear();
        annotations.splice(index, 1);
        // Recalcular os índices de cores para as anotações restantes
        recolorAnnotations();
    }
    if (currentPopupAnnotationId === id) {
        hidePopup();
    }
}

// Recalcular índices de cores
function recolorAnnotations() {
    annotations.forEach((ann, index) => {
        ann.colorIndex = index % annotationColors.length;
        // Se a marcação já existe, atualizar a classe CSS
        if (ann.mark) {
            ann.mark.clear();
            createMark(ann);
        }
    });
}

// Encontrar anotação por ID
function findAnnotationById(id) {
    return annotations.find(ann => ann.id === id);
}

// Mostrar popup com anotação
function showPopup(annotation, mouseEvent) {
    popupText.textContent = annotation.text;
    currentPopupAnnotationId = annotation.id;

    // Posicionar próximo ao mouse
    const x = mouseEvent.pageX + 15;
    const y = mouseEvent.pageY + 15;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.classList.remove('hidden');
}

function hidePopup() {
    popup.classList.add('hidden');
    currentPopupAnnotationId = null;
}

// Mostrar painel de edição de anotação
function showEditPanel(annotation) {
    editText.value = annotation.text;
    editPanel.classList.remove('hidden');
    editText.focus();
    hidePopup();
}

// Salvar edição de anotação
function saveAnnotationEdit(id, newText) {
    const annotation = findAnnotationById(id);
    if (annotation) {
        annotation.text = newText;
        editPanel.classList.add('hidden');
    }
}

// Evento de clique no editor para capturar cliques em marcações
editor.getWrapperElement().addEventListener('mousedown', (e) => {
    // Verify that both panels are hidden before proceeding
    if (!newPanel.classList.contains('hidden') || !editPanel.classList.contains('hidden')) {
        return;
    }
    // Verifica se clicou em um elemento com a classe cm-mark
    const target = e.target.closest('.cm-mark');
    if (target) {
        // Extrai o id do atributo data-id
        const markId = target.getAttribute('data-id');
        if (markId) {
            const id = parseInt(markId, 10);
            const annotation = findAnnotationById(id);
            if (annotation) {
                e.preventDefault(); // evita perda de seleção
                showPopup(annotation, e);
            }
        }
    } else {
        // Clicou fora de uma marcação: esconder popup
        hidePopup();
    }
});

// Clique no botão deletar do popup
popupDelete.addEventListener('click', () => {
    if (currentPopupAnnotationId) {
        removeAnnotationById(currentPopupAnnotationId);
        hidePopup();
    }
});

// Clique no botão editar do popup
popupEdit.addEventListener('click', () => {
    if (currentPopupAnnotationId) {
        const annotation = findAnnotationById(currentPopupAnnotationId);
        if (annotation) {
            showEditPanel(annotation);
        }
    }
});

// Fechar popup se clicar fora (já tratado no mousedown geral, mas também em outros lugares)
document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !e.target.closest('.cm-mark') && !newPanel.contains(e.target) && !editPanel.contains(e.target)) {
        hidePopup();
    }
});

// Botão "Anotar"
btnAnnotate.addEventListener('click', () => {
    const selection = editor.getSelection();
    if (!selection) {
        alert('Selecione um trecho de código primeiro.');
        return;
    }

    // Obter as posições da seleção
    const from = editor.getCursor('from');
    const to = editor.getCursor('to');

    // Mostrar painel de nova anotação
    newText.value = '';
    newPanel.classList.remove('hidden');
    newText.focus();

    // Salvar callback temporário
    const onSave = () => {
        const text = newText.value.trim();
        if (text) {
            addAnnotation(from, to, text);
        }
        newPanel.classList.add('hidden');
        saveBtn.removeEventListener('click', onSave);
        cancelBtn.removeEventListener('click', onCancel);
    };

    const onCancel = () => {
        newPanel.classList.add('hidden');
        saveBtn.removeEventListener('click', onSave);
        cancelBtn.removeEventListener('click', onCancel);
    };

    saveBtn.addEventListener('click', onSave, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });
});

// Salvar edição de anotação
saveEditBtn.addEventListener('click', () => {
    if (currentPopupAnnotationId) {
        const text = editText.value.trim();
        if (text) {
            saveAnnotationEdit(currentPopupAnnotationId, text);
        }
        editPanel.classList.add('hidden');
    }
});

// Cancelar edição de anotação
cancelEditBtn.addEventListener('click', () => {
    editPanel.classList.add('hidden');
});

// Fechar painel de edição se clicar fora
document.addEventListener('click', (e) => {
    if (!editPanel.contains(e.target) && !popup.contains(e.target) && !e.target.closest('.cm-mark')) {
        if (!editPanel.classList.contains('hidden')) {
            editPanel.classList.add('hidden');
        }
    }
});

// Prevenir que o painel de edição suma ao clicar nele
editPanel.addEventListener('mousedown', (e) => e.stopPropagation());

// Exportar
btnExport.addEventListener('click', () => {
    const code = editor.getValue();
    // Remover referências circulares (mark) antes de serializar
    const exportAnnotations = annotations.map(({ id, from, to, text, colorIndex }) => ({
        id, from, to, text, colorIndex
    }));
    const data = {
        code,
        annotations: exportAnnotations
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-study-export.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Importar
btnImport.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!data.code || !Array.isArray(data.annotations)) {
                throw new Error('Formato inválido');
            }

            // Limpar estado atual
            editor.getAllMarks().forEach(mark => mark.clear());
            annotations = [];

            // Restaurar código
            editor.setValue(data.code);

            // Restaurar anotações
            data.annotations.forEach(ann => {
                // Reconstruir com id original e color restrito a índices válidos
                const annotation = {
                    id: ann.id,
                    from: ann.from,
                    to: ann.to,
                    text: ann.text,
                    colorIndex: (ann.colorIndex !== undefined) ? ann.colorIndex : (annotations.length % annotationColors.length)
                };
                annotations.push(annotation);
                createMark(annotation);
            });

            // Limpar input file
            importFile.value = '';
        } catch (err) {
            alert('Erro ao importar arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
});

// Prevenir que o popup suma imediatamente ao clicar nele
popup.addEventListener('mousedown', (e) => e.stopPropagation());

// Prevenir que o painel de nova anotação suma imediatamente ao clicar nele
newPanel.addEventListener('mousedown', (e) => e.stopPropagation());

// Exemplo inicial (opcional)
editor.setValue('# Cole seu código Python aqui\n\ndef exemplo():\n    print("Olá, mundo!")\n\nexemplo()\n\n# Selecione um trecho e clique em "Anotar"');