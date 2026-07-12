import { Link, useLocation } from "react-router-dom";
import { Menu, User, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

import { CartDrawer } from "@/components/CartDrawer";
import { useAuthUser } from "@/lib/use-auth";

import logo from "@/assets/logo.jpg";


const navigation = [
  { name: "Home", path: "/" },
  { name: "Menu", path: "/menu" },
  { name: "Reserveren", path: "/reserveren" },
  { name: "Over ons", path: "/over-ons" },
];


function NavLogo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2"
    >
      <img
        src={logo}
        alt="De Kaaskantine logo"
        className="h-10 w-10 rounded-full object-cover"
      />

      <span className="font-semibold text-lg text-primary">
        De Kaaskantine
      </span>
    </Link>
  );
}


function DesktopNavigation() {

  const location = useLocation();

  return (
    <div className="hidden lg:flex gap-2">

      {navigation.map((item)=>{

        const active = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition
              ${
                active
                ? "text-primary font-bold"
                : "text-foreground/80 hover:text-primary"
              }
            `}
          >
            {item.name}
          </Link>
        );

      })}

    </div>
  );
}



function Actions(){

  const {user} = useAuthUser();


  return (

    <div className="flex items-center gap-2">

      <Link
        to="/menu"
        className="
        hidden sm:flex
        rounded-full
        bg-[var(--brand-gold)]
        px-5 py-2.5
        font-semibold
        text-primary
        "
      >
        Bestellen
      </Link>


      <Link
        to={user ? "/account" : "/auth"}
        className="
        flex items-center justify-center
        h-11 w-11
        rounded-full
        border
        "
      >

        <User size={20}/>

      </Link>


      <CartDrawer/>

    </div>

  );

}




export default function Navbar(){

  const [open,setOpen] = React.useState(false);


  return (

    <header
      className="
      sticky top-0 z-50
      w-full
      bg-background/90
      backdrop-blur
      border-b
      "
    >

      <nav
        className="
        mx-auto
        max-w-7xl
        h-16
        flex
        items-center
        justify-between
        px-4
        "
      >


        <NavLogo/>


        <DesktopNavigation/>


        <div className="flex items-center gap-2">

          <Actions/>


          <Sheet
            open={open}
            onOpenChange={setOpen}
          >

            <SheetTrigger
              className="
              lg:hidden
              h-11 w-11
              rounded-full
              border
              flex
              items-center
              justify-center
              "
            >

              {open
                ?
                <X size={20}/>
                :
                <Menu size={20}/>
              }

            </SheetTrigger>



            <SheetContent
              side="right"
              className="w-full max-w-sm"
            >

              <SheetTitle>
                Menu
              </SheetTitle>


              <div className="mt-8 flex flex-col gap-3">


                {navigation.map(item=>(

                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={()=>setOpen(false)}
                    className="
                    rounded-xl
                    px-4 py-3
                    text-lg
                    hover:bg-secondary
                    "
                  >
                    {item.name}
                  </Link>

                ))}



                <Link
                  to="/menu"
                  onClick={()=>setOpen(false)}
                  className="
                  mt-5
                  rounded-full
                  bg-[var(--brand-gold)]
                  px-5 py-3
                  text-center
                  font-semibold
                  "
                >
                  Bestellen
                </Link>



                <Link
                  to="/reserveren"
                  onClick={()=>setOpen(false)}
                  className="
                  rounded-full
                  border
                  px-5 py-3
                  text-center
                  "
                >
                  Reserveren
                </Link>


              </div>


            </SheetContent>


          </Sheet>


        </div>


      </nav>


    </header>

  );

}
