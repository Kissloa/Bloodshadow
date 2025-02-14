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

    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        editable: false,
        selectable: false,
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

    // Charger les raids en temps réel depuis Firestore
    function loadRaidsFromFirestore() {
        db.collection("raids").onSnapshot((snapshot) => {
            calendar.getEvents().forEach(event => event.remove());

            let raidSelectRemove = document.getElementById('raid-select-remove');
            let raidSelectInscription = document.getElementById('raid-select-inscription');
            raidSelectRemove.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';
            raidSelectInscription.innerHTML = '<option value="">-- Sélectionner un Raid --</option>';

            snapshot.forEach(doc => {
                let raid = doc.data();
                let newEvent = { 
                    id: doc.id, 
                    title: raid.title, 
                    start: raid.dateTime 
                };
                calendar.addEvent(newEvent);

                let optionRemove = new Option(raid.title, doc.id);
                let optionInscription = new Option(raid.title, doc.id);
                raidSelectRemove.appendChild(optionRemove);
                raidSelectInscription.appendChild(optionInscription);
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

        db.collection("raids").add({
            title: raidName,
            ilvl: raidOptions[raidName],
            dateTime: raidDateTime,
            inscriptions: []
        }).then(() => {
            console.log("✅ Raid ajouté !");
        }).catch(error => console.error("❌ Erreur :", error));
    });

    // Retirer un raid
    document.getElementById('remove-raid-btn').addEventListener('click', function () {
        let raidToRemove = document.getElementById('raid-select-remove').value;

        if (!raidToRemove) {
            alert("❌ Sélectionnez un raid à supprimer !");
            return;
        }

        db.collection("raids").doc(raidToRemove).delete().then(() => {
            console.log("✅ Raid supprimé !");
        }).catch(error => console.error("❌ Erreur :", error));
    });

    // S'inscrire à un raid
    document.getElementById('inscription-btn').addEventListener('click', function () {
        let raidId = document.getElementById('raid-select-inscription').value;
        let playerName = document.getElementById('player-name').value;

        if (!playerName || !raidId) {
            alert("❌ Sélectionnez un raid et entrez un pseudo !");
            return;
        }

        let raidRef = db.collection("raids").doc(raidId);
        raidRef.get().then(doc => {
            if (doc.exists) {
                let inscriptions = doc.data().inscriptions || [];
                if (inscriptions.includes(playerName)) {
                    alert("⚠️ Vous êtes déjà inscrit à ce raid !");
                } else {
                    raidRef.update({
                        inscriptions: firebase.firestore.FieldValue.arrayUnion(playerName)
                    }).then(() => {
                        console.log(`✅ ${playerName} inscrit au raid`);
                    });
                }
            }
        });
    });

    // Afficher les inscrits
    document.getElementById('raid-select-inscription').addEventListener('change', function () {
        let raidId = this.value;
        let inscriptionList = document.getElementById('inscription-list');
        inscriptionList.innerHTML = '';

        if (!raidId) return;

        db.collection("raids").doc(raidId).get().then(doc => {
            if (doc.exists) {
                let inscriptions = doc.data().inscriptions || [];
                inscriptions.forEach(playerName => {
                    let listItem = document.createElement('li');
                    listItem.textContent = playerName;
                    inscriptionList.appendChild(listItem);
                });
            }
        });
    });

    // Gestion de l'authentification
    auth.onAuthStateChanged(user => {
        let userStatus = document.getElementById('user-status');
        if (user) {
            userStatus.textContent = `✅ Connecté : ${user.email}`;
        } else {
            userStatus.textContent = "🔴 Déconnecté";
        }
    });

    // Connexion utilisateur
    document.getElementById('login-btn').addEventListener('click', function () {
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                document.getElementById('user-status').textContent = `✅ Connecté : ${userCredential.user.email}`;
            })
            .catch(error => alert("❌ " + error.message));
    });

    // Déconnexion utilisateur
    document.getElementById('logout-btn').addEventListener('click', function () {
        auth.signOut().then(() => {
            document.getElementById('user-status').textContent = "🔴 Déconnecté";
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
