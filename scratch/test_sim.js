const fs = require('fs');
const code = fs.readFileSync('./api/articles.js', 'utf8');
const functions = code.substring(code.indexOf('function getNGrams'), code.indexOf('module.exports'));
eval(functions + `
const titles = [
  'Σενάρια για Τζέριαν Ακραντ και η αναζήτηση ενίσχυσης στην περιφέρεια για τον Παναθηναϊκό',
  'Τα δεδομένα για το μέλλον του Βασίλη Τολιόπουλου και το ενδιαφέρον των «αιωνίων»',
  'Αδιέξοδο στη Super League: Η στάση του Γιάννη Αλαφούζου στις εκλογές για την προεδρία',
  'Στο στόχαστρο του Παναθηναϊκού KTOR ο ��τέιβιντ Τζόουνς Γκαρσία',
  'Αδιέξοδο στη Super League: Νέα ισοπαλία στην εκλογή προέδρου'
];
for (let i=0; i<titles.length; i++) {
  for (let j=i+1; j<titles.length; j++) {
    console.log(i + ' vs ' + j + ': ' + areSimilar(titles[i], titles[j]));
  }
}
`);
