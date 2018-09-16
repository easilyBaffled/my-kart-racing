# Rail Racing
[Rail Racing by easilyBaffled](https://easilybaffled.itch.io/rail-racing)
I made this ridiculous piece of code in 48 hours as part of the [Game Maker’s Toolkit Jam 2018 - itch.io](https://itch.io/jam/gmtk-2018)

The theme was "GENRE, without MECHANIC." Meaning, take something fundamental from a type of game and remove it. So Mario without Jumping, Tennis without a Ball.

I chose to take Driving away from Mario Kart. You can play the result [here](https://easilybaffled.itch.io/rail-racing) (be warned there is music). 

#Development
For the time being, other than this file, and any images used in it, 
I am not going to update the project to preserve the state it was in at the time of submission. 
That state being, good but messy.
All of the code exists in a single file, not for any reason other than I never felt like moving things out. Moreover, the pain of scrolling around was never too high to make better organization necessary.
There was no question that I would write the game in Javascript. From previous jams, I knew that I wouldn’t be building something so big that performance would be an issue. Better to go with what I use every day.

The next choice was to use React because it was made to map state to the DOM so that I could translate the updating game state to a UI more easily than with vanilla JS + HTML. 

The crux of the design was the racer moving along a specified path and being able to hop from one rail to the other. The only came along because, from prior experiences, I knew exactly how to do this with an SVG `<path>` From there it was easier to stick with SVG + HTML rather than using a `canvas`. Plus I ended up not need the performance that a `canvas` would bring. 

The only other major tech decision that I made was to bring in `ramda`. There’s a lot of fun to be had with that toolbox, but I primarily used it for it’s [lenses](https://vanslaars.io/post/setstate-lenses/). Lenses let you directly and immutably, update something deep within an object rather than having to dig deep down to get it.

# Design
It turns out when you take away the finely tuned physics of Mario Kart but leave the track and the items 
you get a sort of rhythm game, without music and with more hazards than Guitar Hero ever had.
