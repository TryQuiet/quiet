workspace {

    model {
    
        properties {
            "structurizr.groupSeparator" "/"
        }

        userA = person "User A" "Owner of Quiet community"
        userB = person "User B" "Member of Quiet community"
        userC = person "User C" "Member of Quiet community"
        userD = person "User D" "Member of Quiet community"
        
        quietB = softwareSystem "Quiet App B" "Linux/MacOS/Windows/Android/iOS"  {
            userB -> this 
        }
        
        quietC = softwareSystem "Quiet App C" "Linux/MacOS/Windows/Android/iOS"  {
            userC -> this 
        }
        
        quietD = softwareSystem "Quiet App D" "Linux/MacOS/Windows/Android/iOS"  {
            userD -> this "One peer is enough for replicating all data"
        }
        
        quietA = softwareSystem "Quiet App" "Linux/MacOS/Windows/Android/iOS"  {
        
            desktops = group "Desktop Apps" {
            
                linux = container "Linux" "React & Electron" {
                    userA -> this 
                }
                
                macOS = container "MacOS" "React & Electron" {
                    userA -> this 
                } 
                
                windows = container "Windows" "React & Electron" {
                    userA -> this 
                }
            }
            
            mobiles = group "Mobiles" {
        
                android = container "Android" "UI layer" "React Native"{
                    userA -> this 
                }
                
                iOS = container "iOS" "UI layer" "React Native"{
                    userA -> this 
                }

                androidBackgroundWorker = group "Android Background Worker" {
                 
                    cpp = container "CPP"  {
                        
                    }
                
                    nodeJSAndroid = container "Node.js Android"  {
                        android -> this 
                        cpp -> this 
                    }
                    
                    notifications = container "Notifications" "Java"  {
                        nodeJSAndroid -> this "Conntected via WebSocket"
                    }
    
                }
             
                nodeJSiOS = container "Node.js iOS"  {
                    iOS -> this 
                }
    
                
            }

            stateManager = container "State Manager" "Redux Toolkit & Redux Saga" {
                linux -> this 
                macOS -> this 
                windows -> this 
                android -> this 
                iOS -> this 
            }
            

            backend = group "Backend" {

                nest = container "Nest JS" "Connection Manager as a core mediator between other services" {
                    stateManager -> this "Conntected via Socket IO"
                    nodeJSAndroid -> this
                    nodeJSiOS -> this 
                }
                
                reigstration = container "Registration Service" {
                    nest -> this 
                }
                
                levelDB = container "levelDB" "local database" {
                    nest -> this 
                }
 
                storage = group "Storage" {
           
                    orbitDB = container "orbitDB" {
                        nest -> this 
                    }
                
                    ipfs = container "IPFS" {
                        orbitDB -> this 
                    }
                
                    libp2p = container "libp2p"{
                         ipfs -> this 
                    }
                    
                }
                
            }
            
            tor = container "Tor"{
                nest -> this 
            }
        
        }
        
  
        quietA -> quietB 
        quietA -> quietC 
        
        quietB -> quietA 
        quietB -> quietC 
        
        quietC -> quietA 
        quietC -> quietB 
        
        quietD -> quietA
        quietA -> quietD
        
    }

       
    views {
        systemLandscape {
             include *
             autolayout 
        }

        container quietA {
             include *
             autolayout 
         }
        

        theme default
    }
}