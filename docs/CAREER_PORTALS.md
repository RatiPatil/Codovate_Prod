# Career portal directory

The built-in directory appears at `/placement?section=career-portals`, inside the existing authenticated placement workspace. Company names, concise business introductions, role areas, industry groups, links and editorial notes live in `frontend/src/careerPortals.json`; the list does not create student records or modify Firebase collections. Existing published folders/articles and administrator editing remain available below it.

Search matches company names, introductions, role tags and industry names. Industry filters combine with search. Company portals open in a new tab with `noopener noreferrer`. Listings describe role areas, not current vacancies. Dunzo remains in the supplied list with no application link because an official active hiring portal was not confirmed. Some entries point to a parent company's careers or to a clearly labeled official company site. Do not substitute third-party application links without reviewing the destination.

The source list has 19 industry groups and 223 listings after merging the repeated Mphasis entry within its industry. Companies may appear in more than one relevant industry. Recheck links periodically: employer routes, ownership and hiring availability change. Automated HTTP checks are not proof of current hiring; some sites restrict automated clients.

Validation: `npm test` and `npm run build`. Publish through the existing Firebase Hosting workflow; this addition needs no Firestore rule/index changes or data import.
