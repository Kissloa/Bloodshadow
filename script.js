// Importation des modules Firebase (v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Définition des niveaux d'objet par raid
const raidOptions = {
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
document.addEventListener('DOMContentLoaded', function () {
    let calendarEl = document.getElementById('calendar');

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

    // Charger les raids depuis Firestore en temps réel
    onSnapshot(collection(db, "raids"), (snapshot) => {
        calendar.getEvents().forEach(event => event.remove());
        document.getElementById('raid-select-remove').innerHTML = "";
        document.getElementById('raid-select-inscription').innerHTML = "";

        snapshot.forEach(doc => {
            let raid = doc.data();
            let event = { title: raid.title, start: raid.dateTime };
            calendar.addEvent(event);
            updateRaidSelectLists(doc.id, raid.title);
        });
    });

    // Mettre à jour les listes de sélection de raids
    function updateRaidSelectLists(id, title) {
        let removeSelect = document.getElementById('raid-select-remove');
        let inscriptionSelect = document.getElementById('raid-select-inscription');

        let optionRemove = new Option(title, id);
        let optionInscription = new Option(title, id);

        removeSelect.appendChild(optionRemove);
        inscriptionSelect.appendChild(optionInscription);
    }

    // Afficher le niveau d'objet du raid sélectionné
    document.getElementById('raid-select').addEventListener('change', function () {
        let raidIlvl = raidOptions[this.value] || "-";
        document.getElementById('raid-ilvl-display').textContent = `Niveau d'objet : ${raidIlvl}`;
    });

    // Ajouter un raid
    document.getElementById('add-raid-btn').addEventListener('click', async function () {
        let raidName = document.getElementById('raid-select').value;
        let raidDate = document.getElementById('raid-date').value;
        let raidTime = document.getElementById('raid-time').value;

        if (!raidName || !raidDate || !raidTime) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        let raidDateTime = `${raidDate}T${raidTime}`;
        let eventTitle = `${raidName} (${raidOptions[raidName]}) - ${raidDate} ${raidTime}`;

        await addDoc(collection(db, "raids"), {
            title: eventTitle,
            name: raidName,
            level: raidOptions[raidName],
            dateTime: raidDateTime,
            inscriptions: []
        });

        alert("Raid ajouté avec succès !");
    });

    // Retirer un raid
    document.getElementById('remove-raid-btn').addEventListener('click', async function () {
        let raidId = document.getElementById('raid-select-remove').value;
        if (!raidId) return;

        await deleteDoc(doc(db, "raids", raidId));
        alert("Raid supprimé !");
    });

    // S'inscrire à un raid
    document.getElementById('inscription-btn').addEventListener('click', async function () {
        let raidId = document.getElementById('raid-select-inscription').value;
        let playerName = document.getElementById('player-name').value.trim();

        if (!raidId || !playerName) {
            alert("Veuillez sélectionner un raid et entrer un pseudo !");
            return;
        }

        let raidRef = doc(db, "raids", raidId);
        await updateDoc(raidRef, {
            inscriptions: firebase.firestore.FieldValue.arrayUnion(playerName)
        });

        alert("Inscription réussie !");
    });

    // Afficher les inscrits d'un raid
    document.getElementById('raid-select-inscription').addEventListener('change', async function () {
        let raidId = this.value;
        let inscriptionList = document.getElementById('inscription-list');
        inscriptionList.innerHTML = '';

        let raidSnapshot = await getDoc(doc(db, "raids", raidId));
        let raidData = raidSnapshot.data();

        (raidData.inscriptions || []).forEach(playerName => {
            let listItem = document.createElement('li');
            listItem.textContent = playerName;
            inscriptionList.appendChild(listItem);
        });
    });

    // Connexion utilisateur
    document.getElementById('login-btn').addEventListener('click', function () {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                document.getElementById('user-status').textContent = `Connecté : ${userCredential.user.email}`;
            })
            .catch(error => alert(error.message));
    });

    // Déconnexion utilisateur
    document.getElementById('logout-btn').addEventListener('click', function () {
        signOut(auth).then(() => {
            document.getElementById('user-status').textContent = "Déconnecté";
        });
    });

    // Gestion de l'état de connexion
    onAuthStateChanged(auth, (user) => {
        document.getElementById('user-status').textContent = user ? `Connecté : ${user.email}` : "Déconnecté";
    });

    // Vue Mois & Semaine
    document.getElementById('month-view-btn').addEventListener('click', () => calendar.changeView('dayGridMonth'));
    document.getElementById('week-view-btn').addEventListener('click', () => calendar.changeView('timeGridWeek'));
});
