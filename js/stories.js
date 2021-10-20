"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  
  // check if story is in user's favorites array 
  let starColor = "hidden";
  if (currentUser) {
    starColor = "far fa-star";
    for (let current of currentUser.favorites) {
      if (story.storyId == current.storyId) {
        starColor = "fas fa-star";
      } 
    }
  }
  
  // Add delete button if user is logged in 
  let deleteClass = "hidden";
  if (currentUser) {
    deleteClass = "" 
  }
  
  return $(`
      <li id="${story.storyId}">
        <span class="star">
          <i class="${starColor} fa-star"></i>
        </span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <span class="delete">
          <i class="${deleteClass} fa fa-trash"></i>
        </span>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
    
    // Add handleFavorite event listener to each start element 
    $(`#${story.storyId} span:first-child > i`).on("click", handleFavorite);
    
    // Add deleteStory event listener to each delete element 
    $(`#${story.storyId} span:last-child > i`).on("click", deleteStory);

  }

  $allStoriesList.show();
}

/** Gets separate list of favorites stories from server, generates their HTML, and puts on page */

function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");
  
  $allStoriesList.empty();
  
  for (let story of storyList.stories) {
    
    // Only put stories that are in currentUser's favorite list 
    if (currentUser.favorites.some(curr => curr.storyId == story.storyId)) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
      
      // Add handleFavorite event listener to each start element 
      $(`#${story.storyId} span:first-child > i`).on("click", handleFavorite);
      
      // Add deleteStory event listener to each delete element 
      $(`#${story.storyId} span:last-child > i`).on("click", deleteStory);
    }
  }
  
  $allStoriesList.show();
}

/** Handles user submitting new story form **/

async function handleSubmitForm(e) {
  console.debug("handleSubmitForm");
  
  // Prevent default behavior 
  e.preventDefault();
  
  // Create Story Object 
  let newStory = {
    author: e.target.submitAuthor.value,
    title: e.target.submitTitle.value,
    url: e.target.submitUrl.value,
  }
  
  // Call Add story 
  await storyList.addStory(currentUser, newStory);
  
  // Put new story on page 
  putStoriesOnPage();
}

$submitForm.on("submit", handleSubmitForm);

/** Handles user clicking on favorite start **/

async function handleFavorite(e) {
  console.debug();
  // Get the list id from event target
  let parentId = $(e.target).parent().parent().attr("id");
  
  // Get the class that the clicked element should be when clicked
  // In other words, If currently "far", change to "far", and vice versa  
  let newClass = this.classList[0] == "far" ? "fas" : "far";
  
  // Replace the old class with newClass 
  this.classList.replace(this.classList[0], newClass);
  
  // If newClass is "far", remove story from favorites
  if (newClass == "far") {
    let story = storyList.stories.find(story => story.storyId == parentId);
    await currentUser.removeFavorite(story);
  }
  // Else, if newClass is "fas", add story to favorites 
  else {
    let story = storyList.stories.find(story => story.storyId == parentId);
    await currentUser.addFavorite(story);
    
  }
}

/* Delete a story from the DOM and the API */

async function deleteStory(e) {
  console.debug();
  e.preventDefault();
  // Get the li id from event target 
  let parentId = $(e.target).parent().parent().attr("id");
  
  // Delete the story from the DOM 
  let $story = $(`#${parentId}`).remove();
  
  // Delete the story from the API 
  let response = await axios({
    url: `${BASE_URL}/stories/${parentId}`,
    method: "DELETE",
    data: {
      token: currentUser.loginToken,
    }
  });
  console.log(response);
}

