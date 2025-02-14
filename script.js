document.addEventListener('DOMContentLoaded', function () {
    let calendarEl = document.getElementById('calendar');

    let raidOptions = {
        "Behemoth": 1620,
        "Echidna NM": 1620,
        "Echidna HM": 1630,
        "Aegir NM": 1660,
        "Aegir HM": 1680,
        "Brelshaza NM": 1670,
        "Brelshaza HM": 1690,
        "Thaemine NM": 1680,
        "Thaemine HM": 1700
    };

    // Initialisation du calendrier FullCalendar
    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',  // Vue par défaut : Mois
        locale: 'fr',
        editable: true,
        selectable: true,
        eventTimeFormat: { 
            hour: '2-digit', 
            minute: '2-digit', 
            meridiem: false 
        },
        headerToolbar: {
            left: 'prev,next today',  // Ajouter le bouton "today"
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' // Ajouter les vues Semaine et Mois
        },
        events: JSON.parse(localStorage.getItem('raids')) || []  // Charger les événements depuis localStorage
    });

    calendar.render();

    // Fonction pour charger les raids stockés dans localStorage
    function loadStoredRaids() {
        let storedRaids = JSON.parse(localStorage.getItem('raids')) || [];
        storedRaids.forEach(event => updateRaidSelectLists(event.title));
    }

    loadStoredRaids();

    // Affichage du niveau d'objet lors de la sélection d'un raid
    document.getElementById('raid-select').addEventListener('change', function () {
        let selectedRaid = this.value;
        let raidIlvl = raidOptions[selectedRaid] || "-";
        document.getElementById('raid-ilvl-display').textContent = `Niveau d'objet : ${raidIlvl}`;
    });

    // Ajouter un raid au calendrier
    document.getElementById('add-raid-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select').value;
        let raidDate = document.getElementById('raid-date').value;
        let raidTime = document.getElementById('raid-time').value;

        if (!raidName || !raidDate || !raidTime) {
            alert("Veuillez sélectionner un raid, une date et une heure !");
            return;
        }

        let raidDateTime = `${raidDate}T${raidTime}`;
        let formattedDate = new Date(raidDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
        let formattedTime = new Date(raidDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        let eventTitle = `${raidName} (${raidOptions[raidName]}) - ${formattedDate} à ${formattedTime}`;
        let newEvent = { title: eventTitle, start: raidDateTime };

        calendar.addEvent(newEvent);
        saveRaidsToLocalStorage(calendar.getEvents());

        updateRaidSelectLists(eventTitle);
    });

    // Sauvegarder les raids dans localStorage
    function saveRaidsToLocalStorage(events) {
        let eventsArray = events.map(event => ({ title: event.title, start: event.startStr }));
        localStorage.setItem('raids', JSON.stringify(eventsArray));
    }

    // Mettre à jour les listes déroulantes (Inscription et Retrait)
    function updateRaidSelectLists(eventTitle) {
        let removeSelect = document.getElementById('raid-select-remove');
        let inscriptionSelect = document.getElementById('raid-select-inscription');

        let optionRemove = new Option(eventTitle, eventTitle);
        let optionInscription = new Option(eventTitle, eventTitle);

        removeSelect.appendChild(optionRemove);
        inscriptionSelect.appendChild(optionInscription);

        document.getElementById('remove-raid-btn').disabled = false;
    }

    // Retirer un raid du calendrier
    document.getElementById('remove-raid-btn').addEventListener('click', function () {
        let raidToRemove = document.getElementById('raid-select-remove').value;

        calendar.getEvents().forEach(event => {
            if (event.title === raidToRemove) {
                event.remove();
            }
        });

        saveRaidsToLocalStorage(calendar.getEvents());
        removeRaidFromSelectLists(raidToRemove);
    });

    // Supprimer un raid des listes déroulantes
    function removeRaidFromSelectLists(raidTitle) {
        let removeSelect = document.getElementById('raid-select-remove');
        let inscriptionSelect = document.getElementById('raid-select-inscription');

        for (let option of [...removeSelect.options, ...inscriptionSelect.options]) {
            if (option.value === raidTitle) {
                option.remove();
            }
        }

        if (removeSelect.options.length === 1) {
            document.getElementById('remove-raid-btn').disabled = true;
        }
    }

    // Stocker les inscriptions dans localStorage
    function saveInscriptionsToLocalStorage(raidName, playerName) {
        let inscriptions = JSON.parse(localStorage.getItem('inscriptions')) || {};
        if (!inscriptions[raidName]) {
            inscriptions[raidName] = [];
        }
        inscriptions[raidName].push(playerName);
        localStorage.setItem('inscriptions', JSON.stringify(inscriptions));
    }

    // Charger et afficher les inscrits pour un raid spécifique
    function loadInscriptions(raidName) {
        let inscriptions = JSON.parse(localStorage.getItem('inscriptions')) || {};
        let inscriptionList = document.getElementById('inscription-list');
        inscriptionList.innerHTML = ''; // Vider la liste

        if (inscriptions[raidName]) {
            inscriptions[raidName].forEach(playerName => {
                let listItem = document.createElement('li');
                listItem.textContent = playerName;
                inscriptionList.appendChild(listItem);
            });
        }
    }

    // Inscription aux raids
    document.getElementById('inscription-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select-inscription').value;
        let playerName = document.getElementById('player-name').value;

        if (!playerName) {
            alert("Entrez un pseudo !");
            return;
        }

        // Sauvegarder l'inscription dans localStorage
        saveInscriptionsToLocalStorage(raidName, playerName);

        // Mettre à jour la liste des inscrits pour ce raid
        loadInscriptions(raidName);
    });

    // Afficher la composition de l'équipe pour un raid sélectionné
    document.getElementById('raid-select-inscription').addEventListener('change', function () {
        let raidName = this.value;
        loadInscriptions(raidName);
    });

    // Vue Mois
    document.getElementById('month-view-btn').addEventListener('click', function () {
        calendar.changeView('dayGridMonth');
    });

    // Vue Semaine
    document.getElementById('week-view-btn').addEventListener('click', function () {
        calendar.changeView('timeGridWeek');
    });

    // Fonction pour le bouton "Today" (Aujourd'hui) pour revenir à la date actuelle
    document.querySelector('.fc-today-button').addEventListener('click', function() {
        calendar.gotoDate(new Date());
    });
});
