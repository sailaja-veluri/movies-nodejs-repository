const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'moviesData.db')

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3008, () => {
      console.log('Server Running at http://localhost:3008/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
const convertToCamelCase = dbobj => {
  return {
    movieId: dbobj.movie_id,
    directorId: dbobj.director_id,
    movieName: dbobj.movie_name,
    leadActor: dbobj.lead_actor,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    ORDER BY
      movie_id;`
  const moviesArray = await db.all(getMoviesQuery)
  response.send(convertToCamelCase(moviesArray))
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO
      movie (director_id, movie_name, lead_actor)
    VALUES
      (
         ${directorId},
        '${movieName}',
        '${leadActor}',
        );`

  const dbResponse = await db.run(addMovieQuery)
  const movieId = dbResponse.lastID
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT
      *
    FROM
      movie
    WHERE
      movie_id = ${movieId};`
  const movie = await db.get(getMovieQuery)
  response.send(convertToCamelCase(movie))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      
      director_id=${directorId},
      movie_name='${movieName}',
      lead_actor='${leadActor}',
    WHERE
      movie_id = ${movieId};`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
    DELETE FROM
      movie
    WHERE
      movie_id = ${movieId};`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director
    ORDER BY
      director_id;`
  const directorsArray = await db.all(getDirectorsQuery)
  response.send(convertToCamelCase(directorsArray))
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params

  const getDirectorsQuery = `
    SELECT
      movie_name
    FROM
      movie 
      NATURAL JOIN director
    WHERE
      director_id = ${directorId};`
  const directorsArray = await db.all(getDirectorsQuery)
  response.send(convertToCamelCase(directorsArray))
})

module.exports = app
