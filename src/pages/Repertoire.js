import { useState, useEffect } from "react";
import { supabase } from "../api"; // 📌 Connexion à Supabase
import * as XLSX from "xlsx";      // ✅ import statique compatible CRA
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";

function Repertoire() {
  const [contacts, setContacts] = useState([]);
  const [assureurs, setAssureurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedAssureur, setSelectedAssureur] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // États pour l'ajout d'un canevas
  const [newAssureur, setNewAssureur] = useState("");
  const [newCategorie, setNewCategorie] = useState("");
  const [newTelephone, setNewTelephone] = useState("");
  const [newCourriel, setNewCourriel] = useState("");
  const [isNewAssureur, setIsNewAssureur] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editedCategorie, setEditedCategorie] = useState("");
  const [editedTelephone, setEditedTelephone] = useState("");
  const [editedCourriel, setEditedCourriel] = useState("");

  useEffect(() => {
    fetchContacts();
    fetchAssureurs();
    fetchUserRole();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from("repertoire")
      .select("*")
      .order("assureur", { ascending: true });

    if (!error) setContacts(data);
    setLoading(false);
  };

  const fetchAssureurs = async () => {
    let { data, error } = await supabase
      .from("repertoire")
      .select("assureur")
      .order("assureur", { ascending: true });

    if (!error) {
      const uniqueAssureurs = [...new Set(data.map((item) => item.assureur))];
      setAssureurs(uniqueAssureurs);
    }
  };

  const fetchUserRole = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (!userError) setUserRole(userData.role);
    }
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.assureur]) acc[contact.assureur] = [];
    acc[contact.assureur].push(contact);
    return acc;
  }, {});

  const addCanevas = async () => {
    const assureurFinal = isNewAssureur ? newAssureur.trim() : newAssureur;

    if (!assureurFinal || !newCategorie || !newTelephone || !newCourriel) {
      alert("Tous les champs sont obligatoires !");
      return;
    }

    const { error } = await supabase.from("repertoire").insert([
      {
        assureur: assureurFinal,
        categorie: newCategorie,
        telephone: newTelephone,
        courriel: newCourriel,
      },
    ]);

    if (!error) {
      setNewAssureur("");
      setNewCategorie("");
      setNewTelephone("");
      setNewCourriel("");
      setIsNewAssureur(false);
      setShowAddForm(false);
      fetchContacts();
      fetchAssureurs();
    }
  };

  const startEditing = (contact) => {
    setEditingId(contact.id);
    setEditedCategorie(contact.categorie);
    setEditedTelephone(contact.telephone);
    setEditedCourriel(contact.courriel);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedCategorie("");
    setEditedTelephone("");
    setEditedCourriel("");
  };

  const saveEdits = async () => {
    const { error } = await supabase
      .from("repertoire")
      .update({
        categorie: editedCategorie,
        telephone: editedTelephone,
        courriel: editedCourriel,
      })
      .eq("id", editingId);

    if (!error) {
      fetchContacts();
      cancelEditing();
    }
  };

  const deleteContact = async (id) => {
    const confirmDelete = window.confirm("❌ Supprimer ce contact ?");
    if (confirmDelete) {
      const { error } = await supabase.from("repertoire").delete().eq("id", id);
      if (!error) fetchContacts();
    }
  };

  const deleteAssureur = async (assureurName) => {
    const confirmDelete = window.confirm(
      `⚠️ Supprimer l'assureur "${assureurName}" et tous ses contacts ?`
    );
    if (confirmDelete) {
      const { error } = await supabase
        .from("repertoire")
        .delete()
        .eq("assureur", assureurName);

      if (!error) {
        fetchContacts();
        fetchAssureurs();
      } else {
        alert("❌ Erreur lors de la suppression");
        console.error(error);
      }
    }
  };

  // ===============================
  // 📥 EXPORT - Excel & Word
  // ===============================
  const fetchAllForExport = async () => {
    // On sélectionne seulement les colonnes utiles à l’export
    const { data, error } = await supabase
      .from("repertoire")
      .select("assureur, categorie, telephone, courriel")
      .order("assureur", { ascending: true });

    if (error) {
      console.error(error);
      throw error;
    }
    return data ?? [];
  };

  // Excel avec en-têtes FR et colonnes ordonnées
  const handleDownloadExcel = async () => {
    try {
      const raw = await fetchAllForExport();
      if (!raw.length) {
        alert("Aucune donnée à exporter.");
        return;
      }

      const rows = raw.map((r) => ({
        Assureur: r.assureur ?? "",
        "Catégorie": r.categorie ?? "",
        "Téléphone": r.telephone ?? "",
        "Courriel": r.courriel ?? "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows, {
        header: ["Assureur", "Catégorie", "Téléphone", "Courriel"],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Répertoire");

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], { type: "application/octet-stream" });
      saveAs(blob, "repertoire.xlsx");
    } catch (e) {
      console.error(e);
      alert("Oups! Export Excel impossible pour le moment.");
    }
  };

  // Word .docx mis en page (titre + tableau)
  const handleDownloadWord = async () => {
    try {
      const rows = await fetchAllForExport();
      if (!rows.length) {
        alert("Aucune donnée à exporter.");
        return;
      }

      const cell = (text, { bold = false, width = 2500 } = {}) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(text ?? ""), bold })],
              alignment: AlignmentType.LEFT,
            }),
          ],
          width: { size: width, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        });

      const headers = ["Assureur", "Catégorie", "Téléphone", "Courriel"];
      const headerRow = new TableRow({
        children: headers.map((h) => cell(h, { bold: true })),
      });

      const dataRows = rows.map((r) =>
        new TableRow({
          children: [cell(r.assureur), cell(r.categorie), cell(r.telephone), cell(r.courriel)],
        })
      );

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "Répertoire téléphonique",
                heading: HeadingLevel.HEADING1,
              }),
              new Paragraph({ text: " " }),
              table,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "repertoire.docx");
    } catch (e) {
      console.error(e);
      alert("Oups! Export Word impossible pour le moment.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-white to-gray-50">
{/* Titre + Boutons d'export (version professionnelle) */}
<div className="flex items-center justify-between mb-8">
  {/* Bloc gauche : icône + titre */}
  <div className="flex items-center gap-4">
    {/* Icône stylée dans un fond dégradé */}
    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
        />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    </div>

    {/* Texte du titre */}
    <div>
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
        Répertoire téléphonique
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Contacts de nos principaux assureurs
      </p>
    </div>
  </div>

  {/* Bloc droit : boutons d'export */}
  <div className="flex gap-3">
    {/* Bouton Excel (vert dégradé) */}
    <button
      onClick={handleDownloadExcel}
      className="px-4 py-2 rounded-lg text-white font-semibold shadow-sm bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-300"
      title="Télécharger la liste complète en Excel"
    >
      📊 Excel
    </button>

    {/* Bouton Word (bleu dégradé) */}
    <button
      onClick={handleDownloadWord}
      className="px-4 py-2 rounded-lg text-white font-semibold shadow-sm bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300"
      title="Télécharger la liste complète en Word"
    >
      📄 Word
    </button>
  </div>
</div>


      {/* 🆕 Formulaire d'ajout (réservé aux admins) */}
      {userRole === "admin" && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-xl mb-8 shadow-sm">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold p-3 rounded-lg text-lg transition-all hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {showAddForm ? "FERMER" : "AJOUTER"}
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showAddForm ? "max-h-screen opacity-100 scale-100 mt-4" : "max-h-0 opacity-0 scale-95"
            }`}
          >
            {/* Sélection ou ajout d'un assureur */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Assureur</label>
              {!isNewAssureur ? (
                <>
                  <select
                    value={newAssureur}
                    onChange={(e) => setNewAssureur(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Sélectionner un assureur</option>
                    {assureurs.map((assureur, index) => (
                      <option key={index} value={assureur}>
                        {assureur}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsNewAssureur(true)}
                    className="text-blue-700 underline text-sm mt-1 hover:text-blue-900"
                  >
                    + Ajouter un nouvel assureur
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Nom de l'assureur"
                    value={newAssureur}
                    onChange={(e) => setNewAssureur(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={() => setIsNewAssureur(false)}
                    className="text-red-600 underline text-sm mt-1 hover:text-red-800"
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Catégorie"
                value={newCategorie}
                onChange={(e) => setNewCategorie(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="Téléphone"
                value={newTelephone}
                onChange={(e) => setNewTelephone(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="Courriel"
                value={newCourriel}
                onChange={(e) => setNewCourriel(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <button
              onClick={addCanevas}
              className="mt-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Chargement des contacts...</p>
      ) : (
        assureurs.map((assureur) => (
          <div key={assureur} className="mb-4">
            <div
              className="group flex justify-between items-center bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-300 rounded-xl"
              onClick={() =>
                setSelectedAssureur(selectedAssureur === assureur ? null : assureur)
              }
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">{assureur}</h2>
                {userRole === "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAssureur(assureur);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                    title="Supprimer l’assureur"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <span
                className={`transform transition-transform duration-300 ${
                  selectedAssureur === assureur ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden
              >
                🔽
              </span>
            </div>

            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                selectedAssureur === assureur
                  ? "max-h-screen opacity-100 scale-100 mt-2"
                  : "max-h-0 opacity-0 scale-95"
              }`}
            >
              <ul className="bg-white border border-gray-200 rounded-xl">
                {groupedContacts[assureur]?.map((contact) => (
                  <li
                    key={contact.id}
                    className="p-3 border-b last:border-b-0 transition-colors hover:bg-gray-50 rounded-xl"
                  >
                    {editingId === contact.id ? (
                      <div className="space-y-2">
                        <input
                          value={editedCategorie}
                          onChange={(e) => setEditedCategorie(e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <input
                          value={editedTelephone}
                          onChange={(e) => setEditedTelephone(e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <input
                          value={editedCourriel}
                          onChange={(e) => setEditedCourriel(e.target.value)}
                          className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={saveEdits}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                          >
                            💾 Enregistrer
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-3 py-1.5 rounded-lg text-sm hover:from-gray-500 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                          >
                            ✖️ Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800">
                          <strong>📌 {contact.categorie} :</strong> 📞 {contact.telephone} ✉️{" "}
                          {contact.courriel}
                        </span>
                        {userRole === "admin" && (
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => startEditing(contact)}
                              className="text-blue-700 hover:text-blue-900 text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Repertoire;
