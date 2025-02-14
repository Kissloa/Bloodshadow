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
    console.log("📅 Script chargé - Initialisation du calendrier");

    let calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error("🚨 Erreur : Élément #calendar introuvable !");
        return;
    }

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
    console.log("✅ Calendrier FullCalendar rendu avec succès");

    // Charger les raids en temps réel depuis Firestore sans duplication
    function loadRaidsFromFirestore() {
    db.collection("raids").onSnapshot((snapshot) => {
        calendar.getEvents().forEach(event => event.remove()); // Supprime les événements avant de recharger

        snapshot.forEach(doc => {
            let raid = doc.data();
            let existingEvent = calendar.getEventById(doc.id);

            // Vérifie si l'événement est déjà présent dans le calendrier
            if (!existingEvent) {
                let newEvent = {
                    id: doc.id,  // Associe chaque événement à son ID Firestore
                    title: raid.title,
                    start: raid.dateTime
                };

                calendar.addEvent(newEvent);
                updateRaidSelectLists(raid.title);
            }
        });
    });
}

    loadRaidsFromFirestore();

    // Ajouter un raid
    document.getElementById('add-raid-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select').value;
        let raidDate = document.getElementById('raid-date').value;
        let raidTime = document.getElementById('raid-time').value;

        if (!raidName || !raidDate || !raidTime) {
            alert("❌ Veuillez sélectionner un raid, une date et une heure !");
            return;
        }

        let raidDateTime = `${raidDate}T${raidTime}`;
        let eventTitle = `${raidName} (${raidOptions[raidName]})`;

        db.collection("raids").add({
            title: eventTitle,
            name: raidName,
            level: raidOptions[raidName],
            dateTime: raidDateTime,
            inscriptions: []
        }).then(() => {
            console.log("✅ Raid ajouté :", eventTitle);
            loadRaidsFromFirestore(); // 🔄 Mise à jour après ajout
        }).catch(error => {
            console.error("❌ Erreur lors de l'ajout :", error);
        });
    });

    // Retirer un raid
    document.getElementById('remove-raid-btn').addEventListener('click', function () {
        let raidToRemove = document.getElementById('raid-select-remove').value;

        db.collection("raids").where("title", "==", raidToRemove).get().then(snapshot => {
            snapshot.forEach(doc => {
                db.collection("raids").doc(doc.id).delete().then(() => {
                    console.log("✅ Raid supprimé :", raidToRemove);
                    loadRaidsFromFirestore();
                }).catch(error => {
                    console.error("❌ Erreur lors de la suppression :", error);
                });
            });
        });
    });

    // S'inscrire à un raid
    document.getElementById('inscription-btn').addEventListener('click', function () {
        let raidName = document.getElementById('raid-select-inscription').value;
        let playerName = document.getElementById('player-name').value;

        if (!playerName) {
            alert("❌ Entrez un pseudo !");
            return;
        }

        db.collection("raids").where("title", "==", raidName).get().then(snapshot => {
            snapshot.forEach(doc => {
                db.collection("raids").doc(doc.id).update({
                    inscriptions: firebase.firestore.FieldValue.arrayUnion(playerName)
                }).then(() => {
                    console.log(`✅ ${playerName} inscrit à ${raidName}`);
                }).catch(error => {
                    console.error("❌ Erreur d'inscription :", error);
                });
            });
        });
    });

    // Afficher les inscrits
    document.getElementById('raid-select-inscription').addEventListener('change', function () {
        let raidName = this.value;
        let inscriptionList = document.getElementById('inscription-list');
        inscriptionList.innerHTML = '';

        db.collection("raids").where("title", "==", raidName).get().then(snapshot => {
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

    // Vérification de connexion Firebase
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('user-status').textContent = `Connecté : ${user.email}`;
        } else {
            document.getElementById('user-status').textContent = "Déconnecté";
        }
    });

    // Connexion utilisateur
    document.getElementById('login-btn').addEventListener('click', function () {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                document.getElementById('user-status').textContent = `Connecté : ${userCredential.user.email}`;
            })
            .catch(error => alert(error.message));
    });

    // Déconnexion utilisateur
    document.getElementById('logout-btn').addEventListener('click', function () {
        auth.signOut().then(() => {
            document.getElementById('user-status').textContent = "Déconnecté";
        });
    });

    // Changer la vue du calendrier
    document.getElementById('month-view-btn').addEventListener('click', function () {
        calendar.changeView('dayGridMonth');
    });

    document.getElementById('week-view-btn').addEventListener('click', function () {
        calendar.changeView('timeGridWeek');
    });
});
