import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile-utils";

interface ProfileInfoProps {
  user: {
    name: string | null;
    email: string;
    id: string;
  } | null;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>Gérez vos informations de profil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user && getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {user?.name || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-4 pt-4 border-t">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nom complet
            </label>
            <p className="text-sm mt-1">{user?.name || "Non renseigné"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-sm mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ID Utilisateur
            </label>
            <p className="text-sm mt-1 font-mono">{user?.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
