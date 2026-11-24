
/*Challenge économétrique du chapitre 2*/

clear
cd "C:\Users\hanoteau\Documents\Documents\Cours KBA économétrie 2025\Chapitre 2\"
log using Challenge.log
use DataGDP.dta

/*******************************************************
1/ les variables sont-elles distribuées normalement, et sinon, peut-on les transformer ?
********************************************************/
ladder GDP /*GDP n'a pas une distribution normale, en revanche, log(GDP) est distribuée normalement. donc, on fera cette transformation */
ladder Exports 
ladder Electricity 
ladder Water 
ladder Internet
ladder Active_population /* c'est un pourcentage est elle a une distribution normale*/
ladder Population /* Population n'est pas distribuée normalement, tandis que son log a une distribution normale*/
ladder Unemployment 
ladder Health /* La distribution de la variable Health n'est pas normal, et aucune des transformations proposées par Stata n'a de distribution normale (test de jarque bera, ladder command)*/
gladder Health /* Une inspection graphique révèle que la transformation log a une distribution proche de la normale. Nous allons donc considérer la transformation log de la variable Health. */
ladder Investment

*FDI, Exports, Electricity, Water, Internet, Unemployment ne sont pas distribuées normalement, et il n'y a pas de transformation qui soit meilleure pour chacune. on remarque cependant que ces variables sont définies comme des pourcentage, et donc, on peut les utiliser ainsi (i.e. sans transformation) comme variables explicatives.

*Transformation des variables qui doivent l'être
gen logGDP=log(GDP)
gen logPop=log(Population)
gen loghealth=log(Health)


/*******************************************************
2/ statistiques descriptives et matrice de corrélation
********************************************************/

tabstat logGDP FDI Exports Electricity Water Internet Active_population logPop Unemployment loghealth Investment, statistics(n sd mean min max) /* table des statistics descriptives*/
pwcorr logGDP FDI Exports Electricity Water Internet Active_population logPop Unemployment loghealth Investment, star(5) /* plusieurs variables sont corrélées significativement avec logGDP tandis qu'Exports, Unemployment et Investment ne sont pas corrélées avec elle. LogPop a une trés forte corrélation positive significative. LogPop, Electricity, Water, Internet, Active_population, et loghealth sont à priori les meilleurs candidats*/


/*******************************************************
3/ Régressions linéraires simples
********************************************************/
regress logGDP logPop
predict respop, r
hettest
regress logGDP Electricity
predict reselec, r
hettest
regress logGDP Water
predict reswater, r
hettest
regress logGDP Internet
predict resint, r
hettest
regress logGDP Active_population
predict resactive_pop, r
hettest
regress logGDP loghealth
predict reshealth, r
hettest
*on tente également les régressions avec les variables restantes, pour vérifier.
regress logGDP FDI
predict resfdi, r
regress logGDP Exports
regress logGDP Unemployment
regress logGDP Investment

/* Pour les régressions avec les variables Investment, Exports, Unemployment, nous observons que nous devons rejeter le test de Fisher de significativé globale des paramètres estimés, et aussi le test de student de significativité de la variable explicative. Aussi, nous décidons d'écarter les variables Investment, Exports, Unemployment.
Le R² le plus élevé est obtenu dans l'ordre pour les régressions avec logPop (R²=0.6206), Electricity (R²=0.2453), loghealth (R²=0.2263), Internet (R²=0.2101), Water (R²=0.1899), Active_population (R²=01690), FDI (R²=0.0314) 

Pour ces variables, nous vérifions si les résidus de la régression ont une distribution normale */

sktest respop reselec reswater resint resactive_pop reshealth resfdi /* les résidus n'ont pas une distribution normale pour LogPop. Cependant, une analyse graphique des résidus indique que leur distribution est proche d'être normale, et nous pourrions alors toujours considérer logPop comme pertinente */
histogram respop, normal

/* Nous vérifions ensuite que l'hypothèse d'homoscedasticité est vérifiée avec le test de Breusch-Pagan. c'est la commande STATA hettest. Selon les résultats, on refait les régressions avec la correction de White (robust standard errors)
Les résultats des tests indiquent que la variance des résidus est toujours constante pour les régressions avec Internet, Water, active_population, et loghealth.
*/

/* On vérifie la présence d'observations influentes (outliers) et si elles pourraient modifier les résultats*/
regress logGDP logPop
predict cooksd if e(sample), cooksd
predict leverage if e(sample), hat
predict studres if e(sample), rstudent

gen outcooksd=(cooksd>1)
gen outleverage=(leverage>0.0258)
gen outstudres1=(studres>2)
gen outstudres2=(studres<-2)
gen out=outcooksd+outleverage+outstudres1+outstudres2
sort out
/* il n'y a pas d'observation qui remplisse au moins deux critères (out>1). Nous en concluons qu'il n'y a pas d'outlier. Nous allons cependant le vérifier avec une analyse graphique*/
graph twoway scatter cooksd logPop, msymbol(i) mlabel(CountryName)
graph twoway scatter studres logPop, msymbol(i) mlabel(CountryName)
graph twoway scatter leverage logPop, msymbol(i) mlabel(CountryName)
/* L'analyse graphique précédente peut nous conduire à réviser le critère de la distance de cook et choisir la valeur seuil 0.2 au lieu de 1*/
gen outcooksd2=(cooksd>0.2)
gen out2=outcooksd2+outleverage+outstudres1+outstudres2
sort out2
/* il n'y a pas davantage d'outliers*/

/****************************
Conclusion
*****************************
Pour 5 variables seulement, les régression linéraires simples présentent un test de Fisher significatif, un test de student significatif sur le paramètre estimé de la variable exogène, et des résidus avec une distribution normale.
On peut ajouter une sixième variable, logPop, si on se fie à l'analyse graphique de la distribution des résidus de la régression, proche de la normalité.
Electricity (R²=0.2453), loghealth (R²=0.2263), Internet (R²=0.2101), Water (R²=0.1899), Active_population (R²=01690)
mais aussi logPop (R²=0.6206)

On choisit donc Electricity suivant une interprétation stricte du test de Jarque-Bera. On peut choisir logPop (R² plus élévé) avec seulement une analyse graphique de la distribution des résidus.

Pour aller plus loin : il serait en réalité plus judicieux de considérer comme variable expliquée endogène le PIB par habitant (GDP per capita) = PIB/population, et certainement de le transformer (log(GDP/population))
*/

EOF