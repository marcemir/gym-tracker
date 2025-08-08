document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const app = document.getElementById('app');
    const splashScreen = document.getElementById('splash-screen');

    const views = {
        routines: document.getElementById('routines-view'),
        routineForm: document.getElementById('routine-form-view'),
        workoutSession: document.getElementById('workout-session-view'),
    };

    // Buttons
    const createRoutineFab = document.getElementById('create-routine-fab');
    const saveRoutineBtn = document.getElementById('save-routine-btn');
    const cancelRoutineBtn = document.getElementById('cancel-routine-btn');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Containers & Inputs
    const routinesList = document.getElementById('routines-list');
    const noRoutinesMessage = document.getElementById('no-routines-message');
    const routineFormView = document.getElementById('routine-form-view');
    const routineFormTitle = document.getElementById('routine-form-title');
    const routineNameInput = document.getElementById('routine-name-input');
    const exercisesContainer = document.getElementById('exercises-container');
    const sessionInfo = {
        name: document.getElementById('session-routine-name'),
        date: document.getElementById('session-date'),
    };
    const sessionExercisesContainer = document.getElementById('session-exercises-container');

    // Confirmation Modal
    const confirmationModalContainer = document.getElementById('confirmation-modal-container');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const cancelConfirmationBtn = document.getElementById('cancel-confirmation-btn');
    let confirmActionCallback = null;


    // --- State Management ---
    let state = { routines: [], history: [] };

    const loadState = () => {
        const savedState = localStorage.getItem('gymTrackerState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state.routines = parsedState.routines || [];
                state.history = parsedState.history || [];
            } catch (error) {
                console.error("Failed to parse state from localStorage", error);
                state = { routines: [], history: [] };
            }
        }
    };

    const saveState = () => {
        localStorage.setItem('gymTrackerState', JSON.stringify(state));
    };

    // --- View Navigation ---
    const showView = (viewName) => {
        Object.values(views).forEach(view => view?.classList.remove('active'));
        const viewToShow = views[viewName];
        if (viewToShow) {
            viewToShow.classList.add('active');
            const heading = viewToShow.querySelector('h2[tabindex="-1"]');
            if (heading) heading.focus({ preventScroll: true });
        }
        if (createRoutineFab) {
            createRoutineFab.style.display = viewName === 'routines' ? 'flex' : 'none';
        }
    };

    // --- Modal Logic ---
    const showConfirmationModal = (config) => {
        if (!confirmationModalContainer || !confirmationTitle || !confirmationMessage || !confirmActionBtn) return;
        confirmationTitle.textContent = config.title;
        confirmationMessage.textContent = config.message;
        confirmActionBtn.textContent = config.confirmText;
        confirmActionBtn.className = 'py-3 px-6 font-bold rounded-lg text-white transition-colors'; // Reset
        confirmActionBtn.classList.add(...config.confirmClasses);
        confirmActionCallback = config.onConfirm;
        confirmationModalContainer.classList.remove('hidden');
        confirmActionBtn.focus();
    };

    const hideConfirmationModal = () => {
        confirmActionCallback = null;
        confirmationModalContainer?.classList.add('hidden');
    };

    // --- Rendering Helpers ---
    const createRoutineCard = (routine) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 p-6 rounded-2xl transform hover:-translate-y-1 transition-transform duration-300 flex flex-col relative';

        const exerciseText = routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios';
        const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;
        const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>`;

        card.innerHTML = `
            <div class="absolute top-3 right-3 flex items-center space-x-2">
                <button data-routine-id="${routine.id}" class="edit-routine-btn p-2 text-gray-500 hover:text-yellow-400 transition-colors rounded-full" aria-label="Editar rutina ${routine.name}">${editIcon}</button>
                <button data-routine-id="${routine.id}" class="delete-routine-btn p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full" aria-label="Eliminar rutina ${routine.name}">${deleteIcon}</button>
            </div>
            <div class="flex-grow">
                <h3 class="text-2xl font-bold tracking-wide text-white">${routine.name}</h3>
                <p class="text-sm text-gray-400 mt-1">${routine.exercises.length} ${exerciseText}</p>
            </div>
            <button data-routine-id="${routine.id}" class="start-workout-btn w-full mt-6 py-3 px-5 font-bold rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition-colors" aria-label="Empezar entrenamiento ${routine.name}">Empezar</button>
        `;
        return card;
    };

    const addExerciseInput = (name = '', sets = 4) => {
        if (!exercisesContainer) return;
        const div = document.createElement('div');
        div.className = 'exercise-entry flex items-center space-x-2';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = name;
        nameInput.className = 'exercise-name-input flex-grow p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white';
        nameInput.placeholder = 'Nombre del ejercicio';
        nameInput.addEventListener('input', () => nameInput.classList.remove('border-red-500'));

        const setsInput = document.createElement('input');
        setsInput.type = 'number';
        setsInput.value = String(sets);
        setsInput.min = '1';
        setsInput.className = 'exercise-sets-input w-20 text-center p-3 rounded-lg bg-gray-700 border-2 border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white';
        setsInput.setAttribute('aria-label', 'Número de series');
        setsInput.addEventListener('input', () => setsInput.classList.remove('border-red-500'));

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-exercise-btn text-gray-500 hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0';
        removeButton.setAttribute('aria-label', 'Quitar ejercicio');
        removeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

        div.appendChild(nameInput);
        div.appendChild(setsInput);
        div.appendChild(removeButton);
        exercisesContainer.appendChild(div);
    };


    // --- Main Rendering Functions ---
    const renderRoutines = () => {
        if (!routinesList || !noRoutinesMessage) return;
        routinesList.innerHTML = '';
        if (state.routines.length === 0) {
            noRoutinesMessage.style.display = 'block';
            routinesList.style.display = 'none';
        } else {
            noRoutinesMessage.style.display = 'none';
            routinesList.style.display = 'grid';
            const fragment = document.createDocumentFragment();
            state.routines.forEach(routine => {
                const card = createRoutineCard(routine);
                fragment.appendChild(card);
            });
            routinesList.appendChild(fragment);
        }
    };

    const openCreateRoutineForm = () => {
        if (!routineFormView || !routineFormTitle || !routineNameInput || !exercisesContainer || !saveRoutineBtn) return;
        routineFormView.removeAttribute('data-editing-id');
        routineFormTitle.textContent = 'Crear Nueva Rutina';
        routineNameInput.value = '';
        routineNameInput.classList.remove('border-red-500');
        exercisesContainer.innerHTML = '';
        saveRoutineBtn.textContent = 'Guardar Rutina';
        addExerciseInput();
        showView('routineForm');
    };

    const openEditRoutineForm = (routineId) => {
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine || !routineFormView || !routineFormTitle || !routineNameInput || !exercisesContainer || !saveRoutineBtn) return;

        routineFormView.dataset.editingId = String(routineId);
        routineFormTitle.textContent = 'Editar Rutina';
        routineNameInput.value = routine.name;
        routineNameInput.classList.remove('border-red-500');
        exercisesContainer.innerHTML = '';
        routine.exercises.forEach(ex => addExerciseInput(ex.name, ex.sets));
        saveRoutineBtn.textContent = 'Actualizar Rutina';
        showView('routineForm');
    };

    const renderWorkoutSession = (routineId) => {
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine || !app || !sessionInfo.name || !sessionInfo.date || !sessionExercisesContainer) return;

        app.dataset.currentRoutineId = String(routineId);
        sessionInfo.name.textContent = routine.name;
        sessionInfo.date.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        sessionExercisesContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        routine.exercises.forEach((exercise, exerciseIndex) => {
            const exerciseCard = document.createElement('div');
            exerciseCard.className = 'bg-gray-800 p-5 rounded-xl';
            exerciseCard.dataset.exerciseName = exercise.name;

            const title = document.createElement('h4');
            title.className = 'text-xl font-bold mb-4 text-yellow-400 tracking-wide';
            title.textContent = exercise.name;
            exerciseCard.appendChild(title);

            const headerRow = document.createElement('div');
            headerRow.className = 'grid grid-cols-4 items-center gap-3 mb-3 text-xs text-gray-400 font-bold uppercase tracking-wider';
            headerRow.setAttribute('aria-hidden', 'true');
            headerRow.innerHTML = `<span>Serie</span><span>Reps</span><span>Peso</span><span>RPE</span>`;
            exerciseCard.appendChild(headerRow);

            for (let i = 1; i <= exercise.sets; i++) {
                const setRow = document.createElement('div');
                setRow.className = 'grid grid-cols-4 items-center gap-3 mb-2 set-row';

                const setLabel = document.createElement('label');
                setLabel.htmlFor = `set-${exerciseIndex}-reps-${i}`;
                setLabel.className = 'font-semibold text-gray-300 sr-only';
                setLabel.textContent = `Serie ${i}`;

                const setSpan = document.createElement('span');
                setSpan.className = 'font-semibold text-gray-300';
                setSpan.setAttribute('aria-hidden', 'true');
                setSpan.textContent = `Serie ${i}`;

                const createInput = (type, ariaLabel) => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.dataset.type = type;
                    input.placeholder = '-';
                    input.className = 'w-full text-center p-2 rounded-lg bg-gray-700 border-2 border-gray-600 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent';
                    input.setAttribute('aria-label', ariaLabel);
                    if (type === 'rpe') { input.step = '0.5'; input.min = '1'; input.max = '10'; }
                    if (type === 'reps') { input.id = `set-${exerciseIndex}-reps-${i}`; }
                    return input;
                };

                setRow.appendChild(setLabel); setRow.appendChild(setSpan);
                setRow.appendChild(createInput('reps', `Repeticiones para ${exercise.name} serie ${i}`));
                setRow.appendChild(createInput('weight', `Peso para ${exercise.name} serie ${i}`));
                setRow.appendChild(createInput('rpe', `RPE para ${exercise.name} serie ${i}`));
                exerciseCard.appendChild(setRow);
            }
            fragment.appendChild(exerciseCard);
        });
        sessionExercisesContainer.appendChild(fragment);
        showView('workoutSession');
    };

    // --- CSV Export ---
    const exportHistoryToCsv = () => {
        if (state.history.length === 0) {
            showConfirmationModal({
                title: 'Historial Vacío',
                message: 'No hay datos de entrenamiento para exportar.',
                confirmText: 'Entendido',
                confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
                onConfirm: () => { }
            });
            return;
        }

        const headers = ["Fecha", "Nombre de la Rutina", "Nombre del Ejercicio", "Numero de Serie", "Repeticiones", "Peso (kg)", "RPE"];
        let csvContent = headers.join(",") + "\r\n";

        state.history.forEach(entry => {
            const { date, routineName, workoutData } = entry;
            workoutData.forEach((exercise) => {
                const { exerciseName, sets } = exercise;
                sets.forEach(set => {
                    const row = [`"${date}"`, `"${routineName}"`, `"${exerciseName}"`, set.set, set.reps ?? '', set.weight ?? '', set.rpe ?? ''];
                    csvContent += row.join(",") + "\r\n";
                });
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `historial_entrenamiento_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Event Handlers ---
    createRoutineFab?.addEventListener('click', openCreateRoutineForm);

    addExerciseBtn?.addEventListener('click', () => addExerciseInput());

    exercisesContainer?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('.remove-exercise-btn')) {
            target.closest('.exercise-entry')?.remove();
        }
    });

    cancelRoutineBtn?.addEventListener('click', () => showView('routines'));

    saveRoutineBtn?.addEventListener('click', () => {
        if (!routineNameInput) return;
        let isValid = true;
        routineNameInput.classList.remove('border-red-500');
        const name = routineNameInput.value.trim();
        if (!name) {
            routineNameInput.classList.add('border-red-500');
            routineNameInput.focus();
            isValid = false;
        }
        const exercises = [];
        const exerciseEntries = document.querySelectorAll('.exercise-entry');
        exerciseEntries.forEach(entry => {
            const nameInput = entry.querySelector('.exercise-name-input');
            const setsInput = entry.querySelector('.exercise-sets-input');
            if (nameInput && setsInput) {
                nameInput.classList.remove('border-red-500');
                setsInput.classList.remove('border-red-500');
                const exName = nameInput.value.trim();
                const exSets = parseInt(setsInput.value, 10);
                let entryIsValid = true;
                if (!exName) {
                    nameInput.classList.add('border-red-500');
                    if (isValid) nameInput.focus();
                    entryIsValid = false;
                }
                if (isNaN(exSets) || exSets <= 0) {
                    setsInput.classList.add('border-red-500');
                    if (isValid && entryIsValid) setsInput.focus();
                    entryIsValid = false;
                }

                if (entryIsValid) {
                    exercises.push({ name: exName, sets: exSets });
                } else {
                    isValid = false;
                }
            }
        });

        if (!isValid) return;

        if (exercises.length === 0) {
            showConfirmationModal({
                title: 'No hay Ejercicios',
                message: 'Por favor, añade al menos un ejercicio válido a la rutina.',
                confirmText: 'Entendido',
                confirmClasses: ['bg-yellow-400', 'hover:bg-yellow-300', 'text-gray-900'],
                onConfirm: () => (document.querySelector('.exercise-name-input'))?.focus()
            });
            return;
        }

        const editingId = routineFormView?.dataset.editingId;
        if (editingId) {
            const routineIndex = state.routines.findIndex(r => r.id === Number(editingId));
            if (routineIndex > -1) {
                state.routines[routineIndex] = { ...state.routines[routineIndex], name, exercises };
            }
        } else {
            state.routines.push({ id: Date.now(), name, exercises });
        }

        saveState();
        renderRoutines();
        showView('routines');
    });

    routinesList?.addEventListener('click', e => {
        const target = e.target;
        const button = target.closest('button');
        if (!button) return;

        const routineIdStr = button.getAttribute('data-routine-id');
        if (!routineIdStr) return;
        const routineId = Number(routineIdStr);

        if (button.classList.contains('start-workout-btn')) {
            renderWorkoutSession(routineId);
        } else if (button.classList.contains('edit-routine-btn')) {
            openEditRoutineForm(routineId);
        } else if (button.classList.contains('delete-routine-btn')) {
            showConfirmationModal({
                title: '¿Eliminar Rutina?',
                message: 'Esta acción no se puede deshacer y borrará la rutina permanentemente.',
                confirmText: 'Eliminar',
                confirmClasses: ['bg-red-600', 'hover:bg-red-700'],
                onConfirm: () => {
                    state.routines = state.routines.filter(r => r.id !== routineId);
                    saveState();
                    renderRoutines();
                }
            });
        }
    });

    cancelWorkoutBtn?.addEventListener('click', () => {
        showConfirmationModal({
            title: '¿Cancelar Entrenamiento?',
            message: 'El progreso no guardado se perderá. ¿Estás seguro?',
            confirmText: 'Sí, Cancelar',
            confirmClasses: ['bg-gray-600', 'hover:bg-gray-500'],
            onConfirm: () => showView('routines')
        });
    });

    finishWorkoutBtn?.addEventListener('click', () => {
        const routineId = Number(app?.dataset.currentRoutineId);
        const routine = state.routines.find(r => r.id === routineId);
        if (!routine || !sessionExercisesContainer) return;

        const workoutData = [];
        const exerciseCards = sessionExercisesContainer.querySelectorAll('[data-exercise-name]');
        exerciseCards.forEach(card => {
            const exerciseName = card.dataset.exerciseName;
            if (!exerciseName) return;

            const sets = [];
            card.querySelectorAll('.set-row').forEach((row, index) => {
                const reps = row.querySelector('[data-type="reps"]')?.value;
                const weight = row.querySelector('[data-type="weight"]')?.value;
                const rpe = row.querySelector('[data-type="rpe"]')?.value;

                if (reps || weight || rpe) {
                    sets.push({
                        set: index + 1,
                        reps: reps ? parseInt(reps, 10) : null,
                        weight: weight ? parseFloat(weight) : null,
                        rpe: rpe ? parseFloat(rpe) : null,
                    });
                }
            });

            if (sets.length > 0) workoutData.push({ exerciseName, sets });
        });

        if (workoutData.length > 0) {
            state.history.push({
                date: new Date().toLocaleDateString('es-ES'),
                routineName: routine.name,
                workoutData,
            });
            saveState();
        }
        showView('routines');
    });

    exportCsvBtn?.addEventListener('click', exportHistoryToCsv);

    // Confirmation Modal Event Listeners
    cancelConfirmationBtn?.addEventListener('click', hideConfirmationModal);
    confirmActionBtn?.addEventListener('click', () => {
        confirmActionCallback?.();
        hideConfirmationModal();
    });

    // --- Initial Load ---
    const handleInitialLoad = () => {
        loadState();
        renderRoutines();
        showView('routines');
        if (splashScreen) {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                if (splashScreen) splashScreen.style.display = 'none';
            }, 1500);
        }
    };

    setTimeout(handleInitialLoad, 1500);
});