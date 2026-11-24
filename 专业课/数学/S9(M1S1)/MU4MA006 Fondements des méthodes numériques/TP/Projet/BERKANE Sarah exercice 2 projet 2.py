# -*- coding: utf-8 -*-
"""
Created on Mon Dec 25 14:57:16 2023

@author: Sarah Keita
"""

import numpy as np
import matplotlib.pyplot as plt 

epsilon = 1
Lambda = 1

def EF1(n):
    """prend en entree le nb de points du maillage et renvoie le systeme lineaire de la methode elements finis P1 lagrange"""
    """pour un maillage uniforme"""
    h = 1/(n+1)
    
    F = np.full(n,h) #tableau de taille n de composante h 

    A = np.zeros((n,n))
    
    for i in range(n-1):
        A[i,i]= epsilon*2/h
        A[i+1,i]= -Lambda/2 - epsilon/h
        A[i,i+1]= Lambda/2 - epsilon/h
    A[n-1,n-1]= epsilon*2/h
   
    
    U = np.linalg.solve(A,F)  
    
    return U

def solution_exacte(x):
    r = Lambda/epsilon
    return -(np.exp(r*x)-1)/(Lambda*(np.exp(r)-1)) + x

n_values = [10,20,50,200,500]
#Tracer la solution pour chaque valeur de n
for n in n_values:
    solution = EF1(n)
    y = np.concatenate([[0],solution,[0]]) #on ajoute les conditions aux limites
    x = np.linspace(0,1,n+2)
    plt.plot(x,y,label='solution approchée pour n='+str(n))

plt.plot(x,solution_exacte(x),label='solution exacte',alpha=0.5)
plt.legend()
plt.title('Solution exacte et approchee en fonction de differentes valeurs de n')
plt.show()

epsilon = 0.1
Lambda = 1
n_values = [10,20,50,200,500]
#Tracer la solution pour chaque valeur de n
for n in n_values:
    solution = EF1(n)
    y = np.concatenate([[0],solution,[0]])
    x = np.linspace(0,1,n+2)
    plt.plot(x,y,label='solution approchee pour n='+str(n))

plt.plot(x,solution_exacte(x),label='solution exacte',color='b')
plt.legend()
plt.title('Solution exacte et approchée en fonction de différentes valeurs de n')
plt.show()

epsilon = 0.01
Lambda = 1
n_values = [10,20,50,200,500]
#Tracer la solution pour chaque valeur de n
for n in n_values:
    solution = EF1(n)
    y = np.concatenate([[0],solution,[0]])
    x = np.linspace(0,1,n+2)
    plt.plot(x,y,label='solution approchée pour n='+str(n))

plt.plot(x,solution_exacte(x),label='solution exacte',color='b')
plt.legend()
plt.title('Solution exacte et approchée en fonction de différentes valeurs de n')
plt.show()


epsilon = 0.01
Lambda = 1
def EF2(N):
    """prend en entree le nb de points du maillage et renvoie la methode des elements finis P1 Lagrange"""
    """pour un maillage non uniforme"""
    X = np.array([(i/(N+1))**(1/4) for i in range(N+2)]) #pas non uniforme
    F = np.zeros(N)
    A = np.zeros((N,N))
    for i in range(N-1):
        x1 = X[i] #xi-1
        x2 = X[i+1] #xi
        x3 = X[i+2] #xi+1
        H = ((x2 - x1)+(x3-x2))/2
        F[i] = H
        A[i,i]= epsilon*((1/(x2-x1)) + (1/(x3-x2)))
        A[i+1,i]= -Lambda/2 - epsilon/(x3-x2)
        A[i,i+1]= Lambda/2 - epsilon/(x3-x2)
    
    i = N-1
    x1 = X[i] #xi-1
    x2 = X[i+1] #xi
    x3 = X[i+2]
    A[N-1,N-1]= epsilon*((1/(x2-x1)) + (1/(x3-x2)))
    
    U = np.linalg.solve(A,F)
    
    return U

n_values = [5,10,20,50,70,80,100,200]
#Tracer la solution pour chaque valeur de n
for n in n_values:
    solution = EF2(n)
    y = np.concatenate([[0],solution,[0]])
    x = np.array([(i/(n+1))**(1/4) for i in range(n+2)])
    plt.plot(x,y,label='solution approchée pour n='+str(n))
plt.plot(x,solution_exacte(x),label='solution exacte',alpha = 0.5)
plt.legend()
plt.title('Solution exacte et approchée en fonction de différentes valeurs de n')
plt.show()