import Types "types";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";

actor {
  let favorites = Map.empty<Text, Types.FavoriteComparison>();
  var nextId : Nat = 0;

  func generateId() : Text {
    let ts = Time.now();
    nextId += 1;
    "fav-" # ts.toText() # "-" # nextId.toText()
  };

  public func saveFavorite(name : Text, countryIds : [Text], metric : Text) : async Text {
    let id = generateId();
    let entry : Types.FavoriteComparison = {
      id;
      name;
      countryIds;
      metric;
      createdAt = Time.now();
    };
    favorites.add(id, entry);
    id
  };

  public query func getFavorites() : async [Types.FavoriteComparison] {
    let all = favorites.values().toArray();
    all.sort(func(a, b) = Int.compare(b.createdAt, a.createdAt))
  };

  public func deleteFavorite(id : Text) : async Bool {
    let existing = favorites.get(id);
    switch (existing) {
      case null false;
      case (?_) {
        favorites.remove(id);
        true
      };
    }
  };
};
