namespace Rapid_Chat.Model
{
    public class Peer
    {
        public int Id { get; set; }
        public string PeerId { get; set; }
        public string RoomName { get; set; }
        public Room Room { get; set; }
        public Peer(string peerId, string roomName)
        {
            this.PeerId = peerId;
            this.RoomName = roomName;
        }
    }
}