// Elements from the DOM 
const searchTypeDropdown = document.getElementById('searchType');
const searchButton = document.getElementById('searchButton');
const searchQueryInput = document.getElementById('searchQuery');
const artistInputDiv = document.getElementById('artistInput'); // Artist input container
const artistNameInput = document.getElementById('artistName'); // Artist name input field
const randomSongDisplay = document.getElementById('randomSong');
const lyricsDisplay = document.getElementById('lyricsDisplay');
const checkAnswersBtn = document.getElementById('checkAnswers');
const scoreDisplay = document.getElementById('score');
const playAgainButton = document.getElementById('playAgainButton'); // Play Again button

// Show/Hide Artist Input Based on Search Type
searchTypeDropdown.addEventListener('change', () => {
  if (searchTypeDropdown.value === 'song') {
    artistInputDiv.style.display = 'block'; // Show artist input for song search
  } else {
    artistInputDiv.style.display = 'none'; // Hide artist input for artist search
  }
});

// Function to fetch random songs dynamically from MusicBrainz API
async function fetchRandomSong(singer) {
  try {
    const encodedSinger = encodeURIComponent(`"${singer}"`);
    const response = await fetch(`https://musicbrainz.org/ws/2/recording?query=artist:${encodedSinger}&fmt=json`);
    if (!response.ok) throw new Error('Error fetching song list.');

    const data = await response.json();
    const recordings = data.recordings;

    if (recordings && recordings.length > 0) {
      const validSongs = recordings
        .map(recording => recording.title.trim())
        .filter(title => title.length > 2);

      if (validSongs.length === 0) throw new Error('No valid songs found.');

      const randomIndex = Math.floor(Math.random() * validSongs.length);
      return validSongs[randomIndex];
    } else {
      throw new Error('No songs found for this artist.');
    }
  } catch (error) {
    console.error('Error fetching random song:', error);
    return null;
  }
}

// Function to fetch lyrics from Lyrics.ovh API
async function fetchLyrics(artist, title) {
  try {
    console.log(`Fetching lyrics for artist: "${artist}", title: "${title}"`);
    const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
    if (!response.ok) throw new Error('Lyrics not found');
    const data = await response.json();
    return data.lyrics;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null; // Return null if lyrics are not found
  }
}

// Handle Search Button Click
searchButton.addEventListener('click', async () => {
  const searchType = searchTypeDropdown.value; // Get selected search type
  const query = searchQueryInput.value.trim(); // Get the main query
  const artist = artistNameInput.value.trim(); // Get optional artist input

  if (!query) {
    randomSongDisplay.innerHTML = 'Please enter a valid query.';
    return;
  }

  if (searchType === 'artist') {
    // Search by artist
    const randomSong = await fetchRandomSong(query);

    if (randomSong) {
      randomSongDisplay.innerHTML = `Random song for ${query}: <strong>${randomSong}</strong>`;

      // Fetch lyrics for the random song
      const lyrics = await fetchLyrics(query, randomSong);

      if (lyrics) {
        const result = hideRandomWords(lyrics); // Automatically calculate blanks
        lyricsDisplay.innerHTML = result.modifiedLyrics; // Display lyrics with blanks
        checkAnswersBtn.style.display = "inline-block"; // Show the Check Answers button
        playAgainButton.style.display = "inline-block"; // Show the Play Again button
        window.hiddenWords = result.hiddenWords; // Save hidden words for checking
        scoreDisplay.innerHTML = ''; // Clear score display
      } else {
        lyricsDisplay.innerHTML = `Lyrics not found for "${randomSong}" by ${query}. Please try again.`;
        playAgainButton.style.display = "inline-block"; // Show the Play Again button
      }
    } else {
      randomSongDisplay.innerHTML = `No songs found for "${query}". Please try another artist.`;
      playAgainButton.style.display = "inline-block"; // Show the Play Again button
    }
  } else if (searchType === 'song') {
    // Search by song title
    randomSongDisplay.innerHTML = `Searching lyrics for song: <strong>${query}</strong>${artist ? ` by ${artist}` : ''}`;

    // Use artist name if provided, otherwise fallback to a generic search
    const lyrics = await fetchLyrics(artist || 'unknown', query);

    if (lyrics) {
      const result = hideRandomWords(lyrics); // Automatically calculate blanks
      lyricsDisplay.innerHTML = result.modifiedLyrics; // Display lyrics with blanks
      checkAnswersBtn.style.display = "inline-block"; // Show the Check Answers button
      playAgainButton.style.display = "inline-block"; // Show the Play Again button
      window.hiddenWords = result.hiddenWords; // Save hidden words for checking
      scoreDisplay.innerHTML = ''; // Clear score display
    } else {
      lyricsDisplay.innerHTML = `Lyrics not found for "${query}"${artist ? ` by ${artist}` : ''}. Please try again.`;
      playAgainButton.style.display = "inline-block"; // Show the Play Again button
    }
  }
});

// Check Answers Button Click Event
checkAnswersBtn.addEventListener('click', () => {
  let correctCount = 0;

  window.hiddenWords.forEach((word, i) => {
    const inputField = document.getElementById(`blank_${i}`);
    const userInput = inputField.value.trim();

    const label = document.createElement('span'); // Create a label for feedback

    if (userInput.toLowerCase() === word.toLowerCase()) {
      correctCount++;
      inputField.style.borderColor = "green"; // Highlight correct answer
      label.textContent = " (Correct!)";
      label.className = "correct-label"; // Add correct label styling
    } else {
      inputField.style.borderColor = "red"; // Highlight incorrect answer
      inputField.className += " incorrect"; // Apply incorrect styling
      label.textContent = ` (Correct: ${word})`; // Show the correct word
      label.style.color = "red";
    }

    inputField.parentNode.insertBefore(label, inputField.nextSibling); // Add label after the field
  });

  // Display the final score
  scoreDisplay.innerHTML = `You got ${correctCount} / ${window.hiddenWords.length} correct!`;
  scoreDisplay.style.color = correctCount === window.hiddenWords.length ? "green" : "red"; // Highlight perfect score

  document.querySelectorAll("input[type='text']").forEach(input => (input.disabled = true));
  checkAnswersBtn.disabled = true;
});

// Replace words with input fields
indicesToHide.forEach((index, i) => {
  hiddenWords.push(words[index]); // Store the hidden word
  words[index] = `<input type="text" id="blank_${i}" class="hidden-word" />`; // Add hidden-word styling
});


// Play Again Button Click Event
playAgainButton.addEventListener('click', () => {
  // Reset the game
  searchQueryInput.value = ''; // Clear song/artist input
  artistNameInput.value = ''; // Clear optional artist input
  searchQueryInput.disabled = false; // Re-enable inputs
  artistNameInput.disabled = false; // Re-enable inputs
  randomSongDisplay.innerHTML = ''; // Clear random song display
  lyricsDisplay.innerHTML = ''; // Clear lyrics display
  scoreDisplay.innerHTML = ''; // Clear score display
  checkAnswersBtn.style.display = "none"; // Hide the "Check Answers" button
  playAgainButton.style.display = "none"; // Hide the "Play Again" button
});

// Function to hide random words in the lyrics
function hideRandomWords(lyrics) {
  const words = lyrics.split(" "); // Split lyrics into individual words
  const indicesToHide = [];
  const hiddenWords = [];

  // Get the selected difficulty
  const difficulty = document.getElementById('difficulty').value;
  let numWordsToHide;

  // Adjust number of blanks based on difficulty
  if (difficulty === 'easy') {
    numWordsToHide = Math.max(3, Math.floor(words.length * 0.1)); // 10% of words
  } else if (difficulty === 'medium') {
    numWordsToHide = Math.max(3, Math.floor(words.length * 0.2)); // 20% of words
  } else if (difficulty === 'hard') {
    numWordsToHide = Math.max(3, Math.floor(words.length * 0.3)); // 30% of words
  }

  // Select random words to hide
  while (indicesToHide.length < numWordsToHide) {
    const randomIndex = Math.floor(Math.random() * words.length);
    if (!indicesToHide.includes(randomIndex)) {
      indicesToHide.push(randomIndex);
    }
  }

  // Replace selected words with input fields
  indicesToHide.forEach((index, i) => {
    hiddenWords.push(words[index]); // Store the hidden word
    words[index] = `<input type="text" id="blank_${i}" class="hidden-word" />`; // Styled input field
  });

  return { modifiedLyrics: words.join(" "), hiddenWords }; // Return modified lyrics and hidden words
}
