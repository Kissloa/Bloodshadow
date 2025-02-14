// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAtERjNNb5VaLjB0TZyfEvQ337fs-a4AfA",
    authDomain: "bloodshadow-ffb01.firebaseapp.com",
    projectId: "bloodshadow-ffb01",
    storageBucket: "bloodshadow-ffb01.appspot.com",
    messagingSenderId: "1037132816744",
    appId: "1:1037132816744:web:9f9519d953b7f7a9bff6dd",
    measurementId: "G-W495PCSSP0"
};

// Initialisation Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
const auth = firebase.auth(app);

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

    // Initialisation du calendrier
    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        editable: true,
        selectable: true,
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: []
    });

    calendar.render();

    // Charger les raids en temps réel depuis Firestore
    function loadRaidsFromFirestore() {
        db.collection("raids").onSnapshot((snapshot) => {
            calendar.getEvents().forEach(event => event.remove());
            snapshot.forEach(doc => {
                let raid = doc.data();
                let newEvent = { title: raid.title, start: raid.dateTime };
                calendar.addEvent(newEvent);
                updateRaidSelectLists(raid.title);
            });
        });
    }

    loadRaidsFromFirestore();

    // Affichage du niveau d'objet lors de la sélection
    document.getElementById('raid-select').addEventListener('change', function () {
        let selectedRaid = this.value;
        let raidIlvl = raidOptions[selectedRaid] || "-";
        document.getElementById('raid-ilvl-display').textContent = `Niveau d'objet : ${raidIlvl}`;
    });

    // Ajouter un raid
    document.getElementById('add-raid-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select').value;
        let raidDate = document.getElementById('raid-date').value;
        let raidTime = document.getElementById('raid-time').value;

        if (!raidName || !raidDate || !raidTime) {
            alert("Veuillez sélectionner un raid, une date et une heure !");
            return;
        }

        let raidDateTime = `${raidDate}T${raidTime}`;
        let eventTitle = `${raidName} (${raidOptions[raidName]}) - ${raidDate} ${raidTime}`;

        db.collection("raids").add({
            title: eventTitle,
            name: raidName,
            level: raidOptions[raidName],
            dateTime: raidDateTime,
            inscriptions: []
        });
    });

    // Mettre à jour les listes déroulantes
    function updateRaidSelectLists(eventTitle) {
        let removeSelect = document.getElementById('raid-select-remove');
        let inscriptionSelect = document.getElementById('raid-select-inscription');

        let optionRemove = new Option(eventTitle, eventTitle);
        let optionInscription = new Option(eventTitle, eventTitle);

        removeSelect.appendChild(optionRemove);
        inscriptionSelect.appendChild(optionInscription);
    }

    // Retirer un raid
    document.getElementById('remove-raid-btn').addEventListener('click', function () {
        let raidToRemove = document.getElementById('raid-select-remove').value;

        db.collection("raids").where("title", "==", raidToRemove).get().then(snapshot => {
            snapshot.forEach(doc => db.collection("raids").doc(doc.id).delete());
        });
    });

    // S'inscrire à un raid
    document.getElementById('inscription-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select-inscription').value;
        let playerName = document.getElementById('player-name').value;

        if (!playerName) {
            alert("Entrez un pseudo !");
            return;
        }

        db.collection("raids").where("title", "==", raidName).get().then(snapshot => {
            snapshot.forEach(doc => {
                db.collection("raids").doc(doc.id).update({
                    inscriptions: firebase.firestore.FieldValue.arrayUnion(playerName)
                });
            });
        });
    });

    // Afficher les inscrits
    document.getElementById('raid-select-inscription').addEventListener('change', function () {
        let raidName = this.value;

        db.collection("raids").where("title", "==", raidName).get().then(snapshot => {
            let inscriptionList = document.getElementById('inscription-list');
            inscriptionList.innerHTML = '';

            snapshot.forEach(doc => {
                let inscriptions = doc.data().inscriptions || [];
                inscriptions.forEach(playerName => {
                    let listItem = document.createElement('li');
                    listItem.textContent = playerName;
                    inscriptionList.appendChild(listItem);
                });
            });
        });
    });

    // Authentification Firebase
    document.getElementById('login-btn').addEventListener('click', function () {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                document.getElementById('user-status').textContent = `Connecté : ${userCredential.user.email}`;
            })
            .catch(error => alert(error.message));
    });

    document.getElementById('logout-btn').addEventListener('click', function () {
        auth.signOut().then(() => {
            document.getElementById('user-status').textContent = "Déconnecté";
        });
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('user-status').textContent = `Connecté : ${user.email}`;
        } else {
            document.getElementById('user-status').textContent = "Déconnecté";
        }
    });

    // Vue Mois
    document.getElementById('month-view-btn').addEventListener('click', function () {
        calendar.changeView('dayGridMonth');
    });

    // Vue Semaine
    document.getElementById('week-view-btn').addEventListener('click', function () {
        calendar.changeView('timeGridWeek');
    });

    // Bouton "Aujourd'hui"
    document.querySelector('.fc-today-button').addEventListener('click', function () {
        calendar.gotoDate(new Date());
    });
});
